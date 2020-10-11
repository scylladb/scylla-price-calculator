import { TupleType } from 'typescript'

export enum MODE {
    CQL,
    LWT,
    NoLWT
}

interface PerfModeData {
    reads: number,
    writes: number
}


let vcpuPerf: Record<MODE, PerfModeData> = {
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

interface CloudPricing {
    onDemand: number,
    reserved: number,
    storage?: number
}

const ScyllaCloudvCPUPricing: CloudPricing = {
    onDemand: 120,
    reserved: 77
}

const ScyllCloudStoragePervCPU = 230
const CompactionOverhead = 2

export function estimatePrice(
    storage: number, 
    reads: number, 
    writes: number,
    _itemSize: number, 
    replicationFactor: number,
    mode: MODE): CloudPricing {
    let perf = vcpuPerf[mode]
    let vcpus = Math.ceil(reads / perf.reads + writes / perf.writes)
    let storageUnits = Math.ceil(storage*replicationFactor*CompactionOverhead / ScyllCloudStoragePervCPU)
    let vcpuUnits = Math.max(vcpus, storageUnits) 

    return {
        onDemand: vcpuUnits*ScyllaCloudvCPUPricing.onDemand,
        reserved: vcpuUnits*ScyllaCloudvCPUPricing.reserved 
    }
}