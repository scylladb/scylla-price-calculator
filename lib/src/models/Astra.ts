import { WorkloadSpec, hoursPerMonth } from '../common'

type MonthlyPrice = number
interface DetailedPricing {
  write: MonthlyPrice,
  read: MonthlyPrice,
  storage: MonthlyPrice,
  dataTransfer: MonthlyPrice
}

const ThroughputAvgFactor = 0.33

const astraPricing = {
  wcu: 1.24,          // per 1M
  rcu: 0.24,          // per 1M
  storage: 0.25,      // GB/month
  dataTransfer: 0.11  // GB/month
}

function estimatedMonthlyThroughput(throughputPerSec: number): number {
  return throughputPerSec * 3600 * hoursPerMonth * ThroughputAvgFactor
}

function calcPrice(workload: WorkloadSpec): DetailedPricing {
  const rcu = estimatedMonthlyThroughput(workload.reads) * Math.ceil(workload.itemSize / 4) / 1E6
  const wcu = estimatedMonthlyThroughput(workload.writes) * Math.ceil(workload.itemSize) / 1E6
  const storageUnits = workload.storage
  const dataTransfer = estimatedMonthlyThroughput(workload.reads) * workload.itemSize / 1E6

  return {
    read: rcu*astraPricing.rcu,
    write: wcu*astraPricing.wcu,
    storage: storageUnits*astraPricing.storage,
    dataTransfer: dataTransfer*astraPricing.dataTransfer
  }
}

export function prices(workload: WorkloadSpec) {
    const price = calcPrice(workload)
    const totalPrice = price.write + price.read + price.storage + price.dataTransfer

    return [
        { id: 'ondemand', name: 'On demand', total: totalPrice, database: 'Astra' }
    ]
}