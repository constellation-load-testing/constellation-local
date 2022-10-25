#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ConstellationLocalStack } from '../lib/constellation-local-stack';

const app = new cdk.App();
new ConstellationLocalStack(app, 'ConstellationLocalStack');
