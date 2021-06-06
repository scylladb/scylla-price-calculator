import { WorkloadSpec, hoursPerMonth } from '../common'
import _ from 'lodash'

export enum MODE {
    CQL = 'CQL',
    LWT = 'LWT',
    NoLWT = 'NoLWT'
}

export interface PerfModeData {
    reads: number
    writes: number
}

const vcpuPerf: Record<MODE, PerfModeData> = {
    [MODE.CQL]: {
        reads: 8000,
        writes: 10000
    },
    [MODE.LWT]: {
        writes: 1200,
        reads: 4000
    },
    [MODE.NoLWT]: {
        writes: 6000,
        reads: 4000
    }
}

const AWSDataTransferPrice = 0.01 // GB/month
const DataThroughputAvgFactor = 0.33
const CompactionOverhead = 1.4 // ICS
const RAMtoDiskRatio = 100
const RAMtoDataRatio = 75 // ICS

const LicenseCorePriceYearly = {
    onDemand: 750 as YearlyPrice,
    reserved: 495 as YearlyPrice
}

interface ResourceSpec {
    readonly vcpu: number
    readonly memory: number
    readonly storage: number
}

interface ClusterSpec {
    readonly nodes: number
    readonly instanceType: InstanceTypeSpec
}

interface NodePricing {
    readonly reserved: MonthlyPrice
    readonly ondemand: MonthlyPrice 
}

type HourlyPrice = number
type MonthlyPrice = number
type YearlyPrice = number

interface InstanceTypeSpec extends ResourceSpec {
    readonly name: string
    readonly computePrice: NodePricing
}

type InstanceTypesSpec = {
    [cloud: string]: InstanceTypeSpec[]
}

const instanceTypes: InstanceTypesSpec = {
    aws: [
        {
            name: 'i3.large',
            vcpu: 2,
            memory: 15.25,
            storage: 475,
            computePrice: {
                ondemand: 113.88,
                reserved: 72.5
            },
        },
        {
            name: 'i3.xlarge',
            vcpu: 4,
            memory: 30.5,
            storage: 950,
            computePrice: {
                ondemand: 227.76,
                reserved: 145.08
            }
        },
        {
            name: 'i3.2xlarge',
            vcpu: 8,
            memory: 61,
            storage: 1900,
            computePrice: {
                ondemand: 455.52,
                reserved: 290.17
            }
        },
        {
            name: 'i3.4xlarge',
            vcpu: 16,
            memory: 122,
            storage: 3800,
            computePrice: {
                ondemand: 911.04,
                reserved: 580.33
            }
        },
        {
            name: 'i3.8xlarge',
            vcpu: 32,
            memory: 244,
            storage: 7600,
            computePrice: {
                ondemand: 1822.08,
                reserved: 1160.67
            }
        },
        {
            name: 'i3.16xlarge',
            vcpu: 64,
            memory: 488,
            storage: 15200,
            computePrice: {
                ondemand: 3644.16,
                reserved: 2321.33
            }
        },
        {
            name: 'i3en.large',
            vcpu: 2,
            memory: 16,
            storage: 1250,
            computePrice: {
                ondemand: 164.98,
                reserved: 104.83
            }
        },
        {
            name: 'i3en.xlarge',
            vcpu: 4,
            memory: 32,
            storage: 2500,
            computePrice: {
                ondemand: 329.96,
                reserved: 209.75
            }
        },
        {
            name: 'i3en.2xlarge',
            vcpu: 8,
            memory: 64,
            storage: 5000,
            computePrice: {
                ondemand: 659.92,
                reserved: 419.50
            }
        },
        {
            name: 'i3en.3xlarge',
            vcpu: 12,
            memory: 96,
            storage: 7500,
            computePrice: {
                ondemand: 989.88,
                reserved: 629.25
            }
        },
        {
            name: 'i3en.6xlarge',
            vcpu: 24,
            memory: 192,
            storage: 15000,
            computePrice: {
                ondemand: 1979.76,
                reserved: 1258.42
            }
        },
        {
            name: 'i3en.12xlarge',
            vcpu: 48,
            memory: 384,
            storage: 30000,
            computePrice: {
                ondemand: 3959.52, 
                reserved: 2516.83
            }
        },
        {
            name: 'i3en.24xlarge',
            vcpu: 96,
            memory: 768,
            storage: 60000,
            computePrice: {
                ondemand: 7919.04,
                reserved: 5033.75
            }
        }
    ]
}

function licensePrice(cluster: ClusterSpec, licensePriceCore: number): MonthlyPrice {
    return cluster.instanceType.vcpu * cluster.nodes * licensePriceCore / 12
}

function ondemandPrice(cluster: ClusterSpec): MonthlyPrice {
    return cluster.nodes * cluster.instanceType.computePrice.ondemand
}

function reservedPrice(cluster: ClusterSpec): MonthlyPrice {
    return cluster.nodes * cluster.instanceType.computePrice.reserved
}

function clusterResources(cluster: ClusterSpec): ResourceSpec {
    return {
        storage: cluster.instanceType.storage * cluster.nodes,
        vcpu: cluster.instanceType.vcpu * cluster.nodes,
        memory: cluster.instanceType.memory * cluster.nodes
    }
}

function itemSizePerfFactor(itemSize: number): number {
    if (itemSize <= 10) {
        return 1
    } else if (itemSize < 100) {
        return 0.75
    } else if (itemSize < 1000) {
        return 0.5
    } else {
        return 0.25
    }
}

/* Cluster size recommendations based on the optimization target:
- performance (CPU) - select nodes with enough storage and max cpu
- storage - select nodes with enough cpu and max storage
- cost - select nodes with just enough cpu and storage, even if smaller nodes
*/
function selectClusterConfigs(specs: ResourceSpec): ClusterSpec[] {
    return instanceTypes.aws.map(instanceType => {
        const nodes = _.find(_.range(1, 300), n => (
            instanceType.vcpu * n >= specs.vcpu &&
            instanceType.memory * n >= specs.memory &&
            instanceType.storage * n >= specs.storage
        )) || 0
        return {instanceType, nodes}
    }).filter(({nodes}) => nodes > 0)
}
    
    
export function selectClusterInstances(
    workload: WorkloadSpec,
    replicationFactor: number,
    perf: PerfModeData,
): ClusterSpec | undefined {
    const diskSpace = workload.storage * CompactionOverhead
    const recommendedResources: ResourceSpec = {
        vcpu: (workload.reads / perf.reads + workload.writes / perf.writes) / itemSizePerfFactor(workload.itemSize),
        storage: diskSpace,
        memory: Math.ceil(workload.storage / RAMtoDataRatio)
    }
    
    const minimalResources: ResourceSpec = {
        ...recommendedResources,
        memory: Math.ceil(diskSpace / RAMtoDiskRatio)
    }
    
    const recommendedConfigs = selectClusterConfigs(recommendedResources)
    const minimalConfigs = selectClusterConfigs(minimalResources)
    
    const lowestPrice = _.chain(minimalConfigs)
    .map(ondemandPrice)
    .min()
    .value()
    
    const bestConfig = (configs: ClusterSpec[]) => _.chain(configs)
    .filter(spec => ondemandPrice(spec) < lowestPrice * 1.2)
    .sortBy('nodes')
    .head()
    .value()
    
    const selectedConfig = bestConfig(recommendedConfigs) || bestConfig(minimalConfigs)
    
    return {
        ...selectedConfig,
        nodes: selectedConfig.nodes*replicationFactor
    }
}


export function clusterCapacity(cluster: ClusterSpec, replicationFactor: number, perfMode: MODE = MODE.CQL) {
    const perf = vcpuPerf[perfMode]
    const totalResources = clusterResources(cluster)
    const dataset =
    totalResources.storage / replicationFactor / CompactionOverhead
    const peakLoad =
    (totalResources.vcpu * (perf.writes + perf.reads)) /
    2 / 
    replicationFactor
    const sustainedLoad = peakLoad * 0.66
    
    return { sustainedLoad, peakLoad, dataset, ...totalResources }
}

export function prices(workload: WorkloadSpec, replicationFactor: number, perfMode: MODE = MODE.CQL) {
    const perf = vcpuPerf[perfMode]
    // currently, Scylla requires each replica to be in a different AZ
    const replicationTraffic =
    hoursPerMonth * 3600 * ((workload.reads + workload.writes) *
    workload.itemSize *
    (replicationFactor - 1)) /
    1e6 * DataThroughputAvgFactor
    const dataTransfer = replicationTraffic * AWSDataTransferPrice
    
    const cluster = selectClusterInstances(workload, replicationFactor, perf)!
    
    const prices = [
        {
            id: 'ondemand',
            name: 'On demand',
            compute: ondemandPrice(cluster),
            license: licensePrice(cluster, LicenseCorePriceYearly.onDemand)
        },
        {
            id: 'reserved',
            name: 'Reserved',
            compute: reservedPrice(cluster),
            license: licensePrice(cluster, LicenseCorePriceYearly.reserved)
        }
    ].map(priceSpec => {
        const {compute, license} = priceSpec
        return {
            ...priceSpec,
            dataTransfer,
            total: compute + license + dataTransfer
        }
    })
    
    return {prices, cluster}
}
