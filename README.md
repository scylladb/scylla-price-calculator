# Scylla price calculator

## Scylla workload estimation and cluster selection
### Workload assumptions
- Throughput given is peak throughput. For data transfer billing and databases which bill on commulative query count (DynamoDB on-demand) we assume average of 1/3 of the peak.
- Item size is the object size used in a query. The terminology for "object" differs between databases, e.g. document, row, item, etc.

### Model assumptions
- In CQL mode, each vCPU gives ~ 6250 reads, 8000 writes sustained; post compactions, repairs etc
- Each operation will use _replication factor_ vCPUs (assumes consistency level ALL for reads)
- Performance degradation due to large item size: > 10kb perf *= 0.75, > 100kb 0.5, > 1MB 0.25
- Compaction overhead ~ 1.4x ([ICS](https://docs.scylladb.com/architecture/compaction/compaction-strategies/#incremental-compaction-strategy-ics))
- RAM to disk ratio 1:30
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

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
