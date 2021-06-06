import { WorkloadSpec } from '../common';
export declare function prices(workload: WorkloadSpec): ({
    id: string;
    name: string;
    total: number;
    storage: number;
    ops: number;
    database: string;
    subname?: undefined;
} | {
    id: string;
    name: string;
    subname: string;
    total: number;
    storage: number;
    ops: number;
    database: string;
})[];
