import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from 'constructs';
import * as config from '../../config.json';

export class ConstellationRemoteStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ROLES
    const testerRemoteRole = new iam.Role(this, "constellation-remote-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: `tester-remote-role-${this.region}` // multi region deployment, otherwise errored for same name
    })

    // add s3 full access to testerRemoteRole - to review
    testerRemoteRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"))

    // add lambda full access to testerRemoteRole - to review
    testerRemoteRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"))
        

    const aggRemoteRole = new iam.Role(this, 'ecsTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: `timestream-db-role-${this.region}` // multi region deployment, otherwise errored for same name
    })

    // add timestream full access to aggRemoteRole - to review
    aggRemoteRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonTimestreamFullAccess')
    )

    // aggRemoteRole also needs lambda access
    aggRemoteRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"))

    // CONSTRUCTS
    // VPC
    const vpc = new ec2.Vpc(this, "vpc-remote-constellation")

    // ECS CLUSTERS
    const cluster = new ecs.Cluster(this, "cluster-constellation", {
      vpc: vpc
    })

    // TASK DEFINITIONS & SERVICES
    // - Data aggregator
    // L3 construct for aggregator due to DNS exposure
    // create a security group for the aggregator
    const aggregatorSecurityGroup = new ec2.SecurityGroup(this, 'aggregator-security-group', {
      vpc: vpc,
      allowAllOutbound: true,
      securityGroupName: `aggregator-security-group-${this.region}`
    })

    // allow all traffic from anywhere to the aggregator - to review
    aggregatorSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), 
      ec2.Port.allTraffic()
    )

    const aggregatorALBService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'constellation-aggregator', {
      cluster: cluster,
      cpu: 4096,
      desiredCount: 1,   
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("jaricheta/constellation-data-aggregator"),
        containerPort: 3003,
        containerName: 'aggregator-container',
        taskRole: aggRemoteRole,
        environment: {
          REGION: this.region,
          HOME_REGION: config.HOME_REGION,
        }
      },
      memoryLimitMiB: 8192,
      publicLoadBalancer: true,
      securityGroups: [aggregatorSecurityGroup],
    })

    // - Tester
    const testerTaskDef = new ecs.FargateTaskDefinition(this, 'constellation-task-def', 
      {
        memoryLimitMiB: 1024,
        cpu: 512,
        taskRole: testerRemoteRole,
      }
    )

    const DNS_OF_AGG = aggregatorALBService.loadBalancer.loadBalancerDnsName

    testerTaskDef.addContainer('constellation-tester-container', {
      image: ecs.ContainerImage.fromRegistry("jaricheta/constellation-load-generator"),
      memoryLimitMiB: 1024,
      containerName: 'constellation-tester-container',
      essential: true, // default for single container taskdefs
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'constellation-tester',
        logRetention: 7 // logs expire after 7 days
      }),
      environment: {
        OUTPUT: `http://${DNS_OF_AGG}`,
        REGION: this.region,
        HOME_REGION: config.HOME_REGION,
      }
    })

    const testerService = new ecs.FargateService(this, 'constellation-tester-service', {
      cluster: cluster,
      taskDefinition: testerTaskDef,
      desiredCount: 1, // change to >1 when ready
    })
  }
}
