import { WorkloadSpec } from '../common';
export declare enum MODE {
    CQL = "CQL",
    LWT = "LWT",
    NoLWT = "NoLWT"
}
export interface PerfModeData {
    reads: number;
    writes: number;
}
interface ResourceSpec {
    readonly vcpu: number;
    readonly memory: number;
    readonly storage: number;
}
interface ClusterSpec {
    readonly nodes: number;
    readonly instanceType: InstanceTypeSpec;
}
interface NodePricing {
    readonly reserved: MonthlyPrice;
    readonly ondemand: MonthlyPrice;
}
declare type MonthlyPrice = number;
interface InstanceTypeSpec extends ResourceSpec {
    readonly name: string;
    readonly computePrice: NodePricing;
}
export declare function selectClusterInstances(workload: WorkloadSpec, replicationFactor: number, perf: PerfModeData): ClusterSpec | undefined;
export declare function clusterCapacity(cluster: ClusterSpec, replicationFactor: number, perfMode?: MODE): {
    vcpu: number;
    memory: number;
    storage: number;
    sustainedLoad: number;
    peakLoad: number;
    dataset: number;
};
export declare function prices(workload: WorkloadSpec, replicationFactor: number, perfMode?: MODE): {
    prices: {
        dataTransfer: number;
        total: number;
        id: string;
        name: string;
        compute: number;
        license: number;
    }[];
    cluster: ClusterSpec;
};
export {};
