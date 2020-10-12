import { CloudPricing, WorkloadSpec } from './common'

export enum MODE {
    CQL = "CQL",
    LWT = "LWT",
    NoLWT = "NoLWT"
}

export interface PerfModeData {
    reads: number;
    writes: number;
}


export const vcpuPerf: Record<MODE, PerfModeData> = {
    [MODE.CQL]: {
        reads: 6250,
        writes: 8000
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


export const ScyllaCloudvCPUPricing: CloudPricing = {
    onDemand: 120,
    reserved: 77
}

const ScyllCloudStoragePervCPU = 230
const CompactionOverhead = 2

export function estimatePrice(
    workload: WorkloadSpec,
    replicationFactor: number,
    mode: MODE): CloudPricing {
        console.log(mode)
    const perf = vcpuPerf[mode]
    const vcpus = Math.ceil(workload.reads / perf.reads + workload.writes / perf.writes)
    const storageUnits = Math.ceil(workload.storage*replicationFactor*CompactionOverhead / ScyllCloudStoragePervCPU)
    const vcpuUnits = Math.max(vcpus, storageUnits) 

    return {
        onDemand: vcpuUnits*ScyllaCloudvCPUPricing.onDemand,
        reserved: vcpuUnits*ScyllaCloudvCPUPricing.reserved 
    }
}