import { WorkloadSpec } from '../common';
export declare function prices(workload: WorkloadSpec): {
    id: string;
    name: string;
    total: number;
    storage: number;
    ops: number;
    database: string;
}[];
