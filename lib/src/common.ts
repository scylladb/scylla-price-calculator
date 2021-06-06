export interface WorkloadSpec {
    reads: number;
    writes: number;
    storage: number;
    itemSize: number;
}

export const hoursPerMonth = 730
