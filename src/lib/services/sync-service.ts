import { prisma } from "@/lib/prisma";

const STATUS_ORDER = ["pending", "approved", "in_progress", "deferred", "completed", "invoiced"];

function isStatusAdvanced(current: string, incoming: string): boolean {
  return STATUS_ORDER.indexOf(current) > STATUS_ORDER.indexOf(incoming);
}

function mapWtfStatus(status: string): string {
  const map: Record<string, string> = {
    pending_approval: "pending",
    approved: "approved",
    in_progress: "in_progress",
    deferred: "deferred",
    completed: "completed",
    rejected: "completed",
    cancelled: "completed",
  };
  return map[status] || "pending";
}

export async function syncWorkOrders() {
  const config = await prisma.appConfig.findUnique({ where: { id: "config" } });
  if (!config?.walkTheFloorApiKey) throw new Error("WalkTheFloor API key not configured");

  const url = config.walkTheFloorUrl || "https://walkthefloor.com";
  const res = await fetch(`${url}/api/v1/work-orders`, {
    headers: { Authorization: `Bearer ${config.walkTheFloorApiKey}` },
  });

  if (!res.ok) {
    const error = `Sync failed: HTTP ${res.status}`;
    await prisma.appConfig.update({ where: { id: "config" }, data: { lastSyncError: error } });
    throw new Error(error);
  }

  const { data: workOrders } = await res.json();
  let synced = 0;
  let skipped = 0;

  for (const wo of workOrders) {
    const existing = await prisma.workOrder.findUnique({ where: { externalId: wo.id } });
    const mappedStatus = mapWtfStatus(wo.status);

    // Match client by location store number if available
    let clientId: string | null = null;
    const locationStoreNumber = wo.location?.storeNumber;
    if (locationStoreNumber) {
      const client = await prisma.client.findUnique({ where: { storeNumber: locationStoreNumber } });
      if (client) clientId = client.id;
    }

    if (existing) {
      if (isStatusAdvanced(existing.status, mappedStatus)) {
        skipped++;
        continue;
      }
      await prisma.workOrder.update({
        where: { externalId: wo.id },
        data: {
          title: wo.title,
          description: wo.description,
          priority: wo.priority,
          status: mappedStatus,
          locationName: wo.location?.name || existing.locationName,
          equipmentName: wo.equipment?.instanceName || existing.equipmentName,
          equipmentType: wo.equipment?.equipmentType?.name || existing.equipmentType,
          estimatedCost: wo.estimatedCost,
          clientId: clientId || existing.clientId,
          externalData: wo,
        },
      });
    } else {
      await prisma.workOrder.create({
        data: {
          externalId: wo.id,
          title: wo.title,
          description: wo.description,
          priority: wo.priority,
          status: mappedStatus,
          source: "walkthefloor",
          locationName: wo.location?.name || null,
          equipmentName: wo.equipment?.instanceName || null,
          equipmentType: wo.equipment?.equipmentType?.name || null,
          estimatedCost: wo.estimatedCost,
          clientId,
          externalData: wo,
        },
      });
    }
    synced++;
  }

  await prisma.appConfig.update({
    where: { id: "config" },
    data: { lastSyncAt: new Date(), lastSyncError: null },
  });

  // Sync locations → clients
  let clientsSynced = 0;
  try {
    const locRes = await fetch(`${url}/api/v1/locations/sync`, {
      headers: { Authorization: `Bearer ${config.walkTheFloorApiKey}` },
    });
    if (locRes.ok) {
      const { data: locations } = await locRes.json();
      for (const loc of locations) {
        if (!loc.storeNumber) continue;
        const existing = await prisma.client.findUnique({ where: { storeNumber: loc.storeNumber } });
        if (existing) {
          await prisma.client.update({
            where: { storeNumber: loc.storeNumber },
            data: {
              name: loc.name,
              address: loc.address || existing.address,
              city: loc.city || existing.city,
              state: loc.state || existing.state,
              zipCode: loc.zipCode || existing.zipCode,
              phone: loc.phone || existing.phone,
              email: loc.email || existing.email,
            },
          });
        } else {
          await prisma.client.create({
            data: {
              name: loc.name,
              storeNumber: loc.storeNumber,
              address: loc.address,
              city: loc.city,
              state: loc.state,
              zipCode: loc.zipCode,
              phone: loc.phone,
              email: loc.email,
            },
          });
        }
        clientsSynced++;
      }
    }
  } catch {}

  return { synced, skipped, clientsSynced, total: workOrders.length };
}

export async function pushStatusToWalkTheFloor(workOrderId: string) {
  const wo = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!wo?.externalId) return null;

  const config = await prisma.appConfig.findUnique({ where: { id: "config" } });
  if (!config?.walkTheFloorApiKey) return null;

  const url = config.walkTheFloorUrl || "https://walkthefloor.com";
  const body: any = { status: wo.status };
  if (wo.status === "deferred") {
    body.deferredDate = wo.deferredDate?.toISOString();
    body.deferredReason = wo.deferredReason;
  }

  const res = await fetch(`${url}/api/v1/work-orders/${wo.externalId}/external-status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${config.walkTheFloorApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return { ok: res.ok, status: res.status };
}
