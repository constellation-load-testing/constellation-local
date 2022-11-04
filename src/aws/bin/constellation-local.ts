#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as config from '../../config.json';
import { ConstellationHomeStack } from '../lib/constellation-home-stack';
import { ConstellationRemoteStack } from '../lib/constellation-remote-stack';

const HOME_REGION = { region: config.HOME_REGION } 
const REMOTE_REGIONS = Object.keys(config.REMOTE_REGIONS)

const app = new cdk.App();
new ConstellationHomeStack(app, 'ConstellationHomeStack', {env: HOME_REGION});

REMOTE_REGIONS.forEach(region => {
  new ConstellationRemoteStack(app, `ConstellationRemoteStack-${region}`, {env: { region }})
})