import { hoursPerMonth, WorkloadSpec } from '../common'

// hourly
const provisionedPricing = {
  wcu: 0.00075,
  rcu: 0.00015
}

// per 1M ops
const onDemandPricing = {
  wcu: 1.45,
  rcu: 0.29
}

const storagePricing = 0.3 // GB/month
const ThroughputAvgFactor = 0.33

export function prices(workload: WorkloadSpec) {
    const wcu = Math.ceil(workload.itemSize) * workload.writes
    const rcu = Math.ceil(workload.itemSize / 4) * workload.reads
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
        database: 'Keyspaces'
    },
    {
        id: 'provisioned',
        name: 'Provisioned',
        total: storage + provisioned,
        storage,
        ops: provisioned,
        database: 'Keyspaces'
    }
    ]
}
