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
Since March 2021, Datastax Astra is "serverless" and their pricing is per read/write query, data storage and data transfer similar to DynamoDB on demand. At this moment they do not have a provisioned/reserved mode. The calculator merely sums up the monthly transaction queries and computes the cost based on Astra pricing. As done for data transfer costs and DynamoDB on-demand, we assume average throughput of 1/3 of the peak throughput specified in the calculator input - this means Astra costs can be as high as 3x if the input throughput is the average and not peak.  
### References
- [Astra pricing page](https://www.datastax.com/products/datastax-astra/pricing)
## AWS DynamoDB and Keyspaces
DynamoDB and Keyspaces have two distinct modes for tables: provisioned and on-demand. On demand is billed by commulative operations count, while provisioned is billed by throughput. Since workload is specified by throughput, we estimate a variable workload with average of 1/3 the peak. E.g. if the specified throughput is 100k reads/sec, commulative billed operations would be `732 hours/month * 3600 sec/month * 100000 reads/sec / 3 = 87,840,000,000 = 87,840 RCU`. Every on-demand capacity unit is 1 million operations.

In the interest of simplicity we are comparing only strong consistency requests - with equivalent consistency level in Scylla. DynamoDB has weaker (and cheaper) consistency level which is not shown in this calculator, and similarly transactional requests as well as Scylla LWT are not shown.
### References
- [DynamoDB provisioned pricing page](https://aws.amazon.com/dynamodb/pricing/provisioned/)
- [DynamoDB on-demand pricing pages](https://aws.amazon.com/dynamodb/pricing/on-demand/)
- [Keyspaces pricing page](https://aws.amazon.com/keyspaces/pricing/)

## Azure CosmosDB
Azure CosmosDB is billed by RU (Request Unit). While the price per RU is well specified, it is unclear how many RUs are consumed by each query. A point read of 1kb item will consume 1 RU, but writes may incur higher RU charges due to indexing, multi AZ replication (1.25X), consistency, etc. Larger item size also consume more RUs but the documentation is very vague about how much. In addition, queries that return multiple items may consume more RUs, and again the documentation is vague regarding the exact billing of such queries. In this model we have assumed multi AZ replication (similar durability to DynamoDB, Keyspaces, Astra and Scylla Cloud), zero indexes and simple single item queries.

## References
- [Request Units in Azure Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/request-units)
- [Azure Cosmos DB pricing](https://azure.microsoft.com/en-us/pricing/details/cosmos-db/)
- [Azure Cosmos DB Capacity calculator](https://cosmos.azure.com/capacitycalculator/)
## Trademarks
- AWS DynamoDB, AWS Keyspaces are trademarks of Amazon.com, Inc
- Datastax is a trademark of Datastax, Inc
- Cassandra is a trademark of the Apache Software Foundation
- Azure CosmosDB is a trademark of the Microsoft corporation
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
