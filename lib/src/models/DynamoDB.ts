import { hoursPerMonth, WorkloadSpec } from '../common'

// hourly
const provisionedPricing = {
  wcu: 0.00065,
  rcu: 0.00013
}

const reservedPricing = {
  wcu: 0.000299232876712328,
  rcu: 5.92e-5
}

// per 1M ops
const onDemandPricing = {
  wcu: 1.25,
  rcu: 0.25
}

const ThroughputAvgFactor = 0.33
const storagePricing = 0.25 // GB/month

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
    const reserved =
    (wcu * reservedPricing.wcu + rcu * reservedPricing.rcu) * hoursPerMonth

    return [
        {
            id: 'dynamodb-on-demand',
            name: 'On demand',
            total: storage + onDemand,
            storage,
            ops: onDemand,
            database: 'DynamoDB'
        },
        {
            id: 'dynamodb-provisioned',
            name: 'Provisioned',
            total: storage + provisioned,
            storage,
            ops: provisioned,
            database: 'DynamoDB'
        },
        {
            id: 'dynamodb-reserved',
            name: 'Provisioned',
            subname: '(1y reserved)',
            total: storage + reserved,
            storage,
            ops: reserved,
            database: 'DynamoDB'
        }
    ]
}
