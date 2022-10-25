#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ConstellationHomeStack } from '../lib/constellation-home-stack';
import { ConstellationRemoteStack } from '../lib/constellation-remote-stack';

const HOME_REGION = { region: "us-west-2" }
const REMOTE_REGION = { region: "us-east-1" }

const app = new cdk.App();
new ConstellationHomeStack(app, 'ConstellationHomeStack', {env: HOME_REGION});
new ConstellationRemoteStack(app, 'ConstellationRemoteStack', {env: REMOTE_REGION})

