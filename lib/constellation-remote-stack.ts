import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from 'constructs';

export class ConstellationRemoteStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    /*Empty Stack*/

    // ROLES
    const timestreamDBRole = new iam.Role(this, 'ecsTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    })

    timestreamDBRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonTimestreamFullAccess')
    )

    // CONSTRUCTS
    // VPC
    const vpc = new ec2.Vpc(this, "vpc-remote-constellation")

    // ECS Cluster
    const cluster = new ecs.Cluster(this, "cluster-constellation", {
      vpc: vpc
    })

    // const telegrafALBServiceTaskDef = new ecs.FargateTaskDefinition(this, 'constellation-telegraf', {
    //   memoryLimitMiB: 1024,
    //   cpu: 512,
    //   taskRole: timestreamDBRole,
    // })

    // telegrafALBServiceTaskDef.addContainer('constellation-telegraf-container', {
    //   image: ecs.ContainerImage.fromRegistry("athresher/teleproto"),
    //   memoryLimitMiB: 1024
    // })
    // .addPortMappings({
    //   containerPort: 8186,
    //   protocol: ecs.Protocol.TCP
    // })

    const telegrafALBService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'constellation-telegraf', {
      cluster: cluster,
      cpu: 512,
      desiredCount: 1,   
      // taskDefinition:    
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("athresher/teleproto"),
        containerPort: 8186,
        containerName: 'telegraf-container',
        taskRole: timestreamDBRole,
      },
      memoryLimitMiB: 1024,
      publicLoadBalancer: true      
    })
    
    // const testerTaskDef = new ecs.FargateTaskDefinition(this, 'constellation-tester', {
    //   memoryLimitMiB: 1024,
    //   cpu: 512,      
    // })

    // testerTaskDef.addContainer('constellation-tester-container-def', {
    //   image: ecs.ContainerImage.fromRegistry("athresher/loader_prototype"),
    //   memoryLimitMiB: 1024,
    //   essential: false, // <-- wont restart at test conclusion (container termination)
    //   containerName: 'constellation-tester-container-def',
    //   environment: {
    //     URL: "https://loader-prototype.s3.us-west-1.amazonaws.com/test_script.js?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEAgaCXVzLXdlc3QtMiJGMEQCIDj3vKZBxuDheEwMPVqEwXe2Kdy%2BsrXW2sKPwB4uRwofAiB906%2B1%2FG6zXKN77AUXl26MqWuLXQTTQVGVwpo%2FVYtEfSqEAwjh%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDU3ODc5MDQ4NTc4NCIMOLYkxMRTCRN9feRAKtgCEBYGUMxGTMpdF14aNGdQuGa%2FEB%2BaUKwDxcMsb5W74yKjhGWaPULIahPB0NfZXSlmETDzs04GNM%2FwIQQMFlsSW4Lm5hxSNvSXGhkUWm4CSWABP8zzBztw09k3w9lUs9ZAjuWFejY%2BLEw82pNSOQAjSCaV6NgrOPbEcKdmRi4k2LY19trK8Ata5C3ikQtOfwZIK1BN%2BlCX1fpCbfOU4zuUziVtQf5pQPr%2BGuwlP9YQ0Za4wTfd8p0udZpg%2B9%2BiU43w9Wa0y%2BxYasf13TfCeXD5jtlrj3Ap6L%2FzbFa24bZXpTGHn6sXtyF4SrvH%2FjsGTOMj3x0ehgopW23L5IiLsPmmv%2Bf3WPw%2FRqcr5bqLlz8stCUjEyMzXImo0e4z2NHMQVjXTEgWZ%2FfQcO9OjemIDMoQW0eS4scO7EOYZ6WRACGTX5W284Doy5mNcObZGkFL%2FZgYwBEGJSeaqHQwr4bhmgY6tAJOJBwOyHKa9YqVfdRz9mD28pZcwi7Cf0IrKkC%2FK0VKbVxQ4skB6DfDSEJJ8aAJToBDXpGnZaQ96HCJfe8FVx9IB0Jk7v1QmBlMd%2FaIujoMzUxvp4NA7R8PjItZm1hvFwkBbhuwYpQjkCGmKrfzk5IdvecgCFo46QeRsdntfpEwtFg17kYRy2Gq4XqduDNlLUq4AW84nRNX81L2I%2Bemsf9Bw2lg%2BG1USgAVeQxRYNhmKqIoNboe5T4uLK7DN1cMuOiR6Wn5wj8ugbXebGOaZdU0xx5e6P1%2B7kp6SDvwRHRT3wiDFC15IPQalN%2BBK9gBMMON5AaHYWjkCey1bpi1k3aeDOtze%2BeVNSSX5cVdkdX1B4a2w%2Fl9f0xgm2mOXzcqehDWYk64m2B%2BRZwk6ZGOVBJFYBZAqQ%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20221025T232424Z&X-Amz-SignedHeaders=host&X-Amz-Expires=43200&X-Amz-Credential=ASIAYNQUZ54MNYIVQPAS%2F20221025%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Signature=9f56055a07437f660ecf1fc55e8d79c6692ae08e117055d3fcc719749e765c2d", // consider how to pass this from home region image url
    //     DNS: telegrafALBService.loadBalancer.loadBalancerDnsName,        
    //   }
    // })

    const testersALBService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'constellation-testers', {
      cluster: cluster,
      cpu: 512,
      desiredCount: 1,
      // taskDefinition: testerTaskDef,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("jaricheta/express_3000"), // <--- mock
        // image: ecs.ContainerImage.fromAsset(path.resolve(_dirname, relative-path-to-folder-containing-Dockerfile))
        containerPort: 3000,
        containerName: 'dummy_container'
      },
      memoryLimitMiB: 2048,
      publicLoadBalancer: true      
    })    

    testersALBService.taskDefinition.addContainer('constellation-tester-container-def', {
      image: ecs.ContainerImage.fromRegistry("athresher/loader_prototype"),
      memoryLimitMiB: 1024,
      essential: false, // <-- wont restart at test conclusion (container termination)
      containerName: 'constellation-tester-container-def',
      environment: {
        URL: "https://loader-prototype.s3.us-west-1.amazonaws.com/test_script.js?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEAgaCXVzLXdlc3QtMiJGMEQCIDj3vKZBxuDheEwMPVqEwXe2Kdy%2BsrXW2sKPwB4uRwofAiB906%2B1%2FG6zXKN77AUXl26MqWuLXQTTQVGVwpo%2FVYtEfSqEAwjh%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDU3ODc5MDQ4NTc4NCIMOLYkxMRTCRN9feRAKtgCEBYGUMxGTMpdF14aNGdQuGa%2FEB%2BaUKwDxcMsb5W74yKjhGWaPULIahPB0NfZXSlmETDzs04GNM%2FwIQQMFlsSW4Lm5hxSNvSXGhkUWm4CSWABP8zzBztw09k3w9lUs9ZAjuWFejY%2BLEw82pNSOQAjSCaV6NgrOPbEcKdmRi4k2LY19trK8Ata5C3ikQtOfwZIK1BN%2BlCX1fpCbfOU4zuUziVtQf5pQPr%2BGuwlP9YQ0Za4wTfd8p0udZpg%2B9%2BiU43w9Wa0y%2BxYasf13TfCeXD5jtlrj3Ap6L%2FzbFa24bZXpTGHn6sXtyF4SrvH%2FjsGTOMj3x0ehgopW23L5IiLsPmmv%2Bf3WPw%2FRqcr5bqLlz8stCUjEyMzXImo0e4z2NHMQVjXTEgWZ%2FfQcO9OjemIDMoQW0eS4scO7EOYZ6WRACGTX5W284Doy5mNcObZGkFL%2FZgYwBEGJSeaqHQwr4bhmgY6tAJOJBwOyHKa9YqVfdRz9mD28pZcwi7Cf0IrKkC%2FK0VKbVxQ4skB6DfDSEJJ8aAJToBDXpGnZaQ96HCJfe8FVx9IB0Jk7v1QmBlMd%2FaIujoMzUxvp4NA7R8PjItZm1hvFwkBbhuwYpQjkCGmKrfzk5IdvecgCFo46QeRsdntfpEwtFg17kYRy2Gq4XqduDNlLUq4AW84nRNX81L2I%2Bemsf9Bw2lg%2BG1USgAVeQxRYNhmKqIoNboe5T4uLK7DN1cMuOiR6Wn5wj8ugbXebGOaZdU0xx5e6P1%2B7kp6SDvwRHRT3wiDFC15IPQalN%2BBK9gBMMON5AaHYWjkCey1bpi1k3aeDOtze%2BeVNSSX5cVdkdX1B4a2w%2Fl9f0xgm2mOXzcqehDWYk64m2B%2BRZwk6ZGOVBJFYBZAqQ%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20221025T232424Z&X-Amz-SignedHeaders=host&X-Amz-Expires=43200&X-Amz-Credential=ASIAYNQUZ54MNYIVQPAS%2F20221025%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Signature=9f56055a07437f660ecf1fc55e8d79c6692ae08e117055d3fcc719749e765c2d", // consider how to pass this from home region image url
        DNS: telegrafALBService.loadBalancer.loadBalancerDnsName,        
      }
    })


    
  }
}
