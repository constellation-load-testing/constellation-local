#! /usr/bin/env node

const {program} = require('commander');
const {exec} = require('node:child_process');

program
	.command('deploy')
	.description('Deploy the home region with timestream DB')
	.action(exec('npm run deploy:home'));

program
	.command('run <script.js>')
	.description('Run a test with regions and VU count described in script.js')
	.action(exec('npm run deploy:remote'));

program
	.command('visualize')
	.description('Visualize the results of the test')
	.action('');

program
	.command('teardown')
	.description('Ready program for next test, and stop all container instances')
	.action(exec('npm run destroy:all'));


