// require the ecs client
const {
  ECSClient,
  ListClustersCommand,
  ListServicesCommand,
  UpdateServiceCommand,
  DeleteServiceCommand,
  StopTaskCommand,
  ListTasksCommand,
} = require("@aws-sdk/client-ecs");

/**
 * This function will deprovision the ECS services and tasks by
 * - getting all clusters
 * - filtering cluster based on `constellation` keyword to get `cluster`
 * - getting all services within `cluster`
 * - setting desired count to 0 for each service
 * - deleting all services to drain tasks
 * - force stop all tasks due to DRAINING/RUNNING delay
 */
const deprovisionECSServices = async ({ region }) => {
  const client = new ECSClient({
    region: region,
  });
  // get clusters
  const clusters = await client.send(new ListClustersCommand({}));

  // filter by cluster name, look for `constellation`
  const cluster = clusters.clusterArns.find((cluster) => {
    return cluster.includes("constellation");
  });
  // iterate through services of cluster and update desired count to 0
  console.log({ cluster });

  const services = await client.send(
    new ListServicesCommand({
      cluster,
    })
  );

  // update all services with a desired count of 0
  for (const service of services.serviceArns) {
    console.log({ service });
    const params = {
      cluster,
      service,
      desiredCount: 0,
    };

    await client.send(new UpdateServiceCommand(params));
  }

  // delete services to auto drain tasks
  for (const service of services.serviceArns) {
    console.log({ service });
    const params = {
      cluster,
      service,
    };

    await client.send(new DeleteServiceCommand(params));
  }

  // stop all tasks - even the ones that are draining
  // - this is so that tasks are not left in a draining state
  // - and more quickly stopped
  const tasks = await client.send(
    new ListTasksCommand({
      cluster,
    })
  );

  for (const task of tasks.taskArns) {
    console.log({ task });
    const params = {
      cluster,
      task,
    };

    await client.send(new StopTaskCommand(params));
  }

  // clusters are not deleted - they are left for log accessibility,
  // - they are deleted "manually" by the user via cdk
};

module.exports = {
  deprovisionECSServices,
};
