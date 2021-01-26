# Scylla price calculator
All prices are calculated for US regions only (us-east-1 in the case of AWS). Prices may differ between regions of cloud providers.

## Scylla workload estimation and cluster selection
### Workload assumptions
- Throughput given is peak throughput. For data transfer billing and databases which bill on commulative query count (DynamoDB on-demand) we assume average of 1/3 of the peak.
- Item size is the object size used in a query. The terminology for "object" differs between databases, e.g. document, row, item, etc.
- Consistency level is assumed to be strong (W+R > RF+1).
### Model assumptions
- In CQL mode, each vCPU gives ~ 8000 reads, 10000 writes sustained; post compactions, repairs etc
- Each operation will use _replication factor_ vCPUs (assumes consistency level ALL for reads)
- Performance degradation due to large item size: > 10kb perf *= 0.75, > 100kb 0.5, > 1MB 0.25
- Compaction overhead ~ 1.4x ([ICS](https://docs.scylladb.com/architecture/compaction/compaction-strategies/#incremental-compaction-strategy-ics))
- RAM to disk ratio 1:32
- Replicas are on different AZs and all writes eventually propagate to all replicas

Currently only CQL is enabled in the UI (but the code supports alternator)

### Required resources estimation
```javascript
const vcpus = Math.ceil((workload.reads / perf.reads + workload.writes / perf.writes)*replicationFactor/itemSizePerfFactor(workload.itemSize))
const memory = Math.ceil(workload.storage / RAMtoDiskRatio)*replicationFactor
const storage = workload.storage * replicationFactor * CompactionOverhead
```

### Cluster recommendation logic
For a specific workload, there are multiple eligible cluster configurations, specifically we usually have configurations with many small nodes or few large nodes. With smaller nodes we have better fit for required resources and thus lower price (although not by much) but performance usually isn't as good. Therefor, the selection logic will:
- Select all configurations where resource requirements are fulfilled
- Find the lowest price possible
- Select a configuration with the least amount of nodes (and largest instance types) that has a price less than 120% of the minimal price 

This logic, while pretty dumb, works pretty well.

## Datastax Astra
Astra calculator and sizing blog post describe different service levels (latencies) for their C* instances. Since Scylla always provides much lower latency than C*, we are comparing with Astra on their claimed "0-25ms" range. We recommend benchmarking both Scylla cloud and Astra yourself to see what latency is actually provided under the suggested configuration - but for the purpose of comparing price we will use Astra suggested configuration as described by Datastax.

Astra "D" (dense) tier instances are earmarked by Datastax for use with "immutable or time series data" and are therefor not part of the comparison made by this calculator. A proper comparison would require accounting for compaction strategies, data read/write patterns and more and would complicate the calculator greatly.
### References
- [Astra pricing page](https://www.datastax.com/products/datastax-astra/pricing)
- [Astra pricing calculator](https://www.datastax.com/products/datastax-astra-calculator)
- [Astra sizing blog post](https://www.datastax.com/blog/2020/11/sizing-matters-sizing-astra-apache-cassandra-apps)
## AWS DynamoDB and Keyspaces
DynamoDB and Keyspaces have two distinct modes for tables: provisioned and on-demand. On demand is billed by commulative operations count, while provisioned is billed by throughput. Since workload is specified by throughput, we estimate a variable workload with average of 1/3 the peak. E.g. if the specified throughput is 100k reads/sec, commulative billed operations would be `732 hours/month * 3600 sec/month * 100000 reads/sec / 3 = 87,840,000,000 = 87,840 RCU`. Every on-demand capacity unit is 1 million operations.

In the interest of simplicity we are comparing only strong consistency requests - with equivalent consistency level in Scylla. DynamoDB has weaker (and cheaper) consistency level which is not shown in this calculator, and similarly transactional requests as well as Scylla LWT are not shown.
### References
- [DynamoDB provisioned pricing page](https://aws.amazon.com/dynamodb/pricing/provisioned/)
- [DynamoDB on-demand pricing pages](https://aws.amazon.com/dynamodb/pricing/on-demand/)
- [Keyspaces pricing page](https://aws.amazon.com/keyspaces/pricing/)
## Trademarks
- AWS DynamoDB, AWS Keyspaces are trademarks of Amazon.com, Inc
- Astra is a trademark of Datastax, Inc
- Cassandra is a trademark of the Apache Software Foundation
These trademarks are registered in the USA and other countries. No endoresments are implied by the use of these trademarks.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```
