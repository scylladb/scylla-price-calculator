export interface WorkloadSpec {
    reads: number;
    writes: number;
    storage: number;
    itemSize: number;
}

export interface CloudPricing {
    onDemand: number;
    reserved: number;
    storage?: number;
}

export const hoursPerMonth = 730
