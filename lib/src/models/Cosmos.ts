import { hoursPerMonth, WorkloadSpec } from '../common'

// hourly ($0.008 per 100RU)
const provisionedPricing = {
  wcu: 0.00008,
  rcu: 0.00008
}

// per 1M ops
const onDemandPricing = {
  wcu: 0.25,
  rcu: 0.25
}

const storagePricing = 0.25 // GB/month
const CrossAZRUModifier = 1.25
const ThroughputAvgFactor = 0.33

export function prices(workload: WorkloadSpec) {
    const wcu = Math.ceil(workload.itemSize) * workload.writes * CrossAZRUModifier
    const rcu = Math.ceil(workload.itemSize / 4) * workload.reads * CrossAZRUModifier
    const storage = workload.storage * storagePricing
    const onDemand =
    ((rcu * onDemandPricing.rcu + wcu * onDemandPricing.wcu) *
        3600 *
        hoursPerMonth) /
    1e6 * ThroughputAvgFactor
    const provisioned =
    (wcu * provisionedPricing.wcu + rcu * provisionedPricing.rcu) *
    hoursPerMonth

    return [
    {
        id: 'on-demand',
        name: 'On demand',
        total: storage + onDemand,
        storage,
        ops: onDemand,
        database: 'cosmos'
    },
    {
        id: 'provisioned',
        name: 'Provisioned',
        total: storage + provisioned,
        storage,
        ops: provisioned,
        database: 'cosmos'
    }
    ]
}
