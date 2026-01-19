import * as core from '@actions/core'
import { promises as fs } from 'fs'
import * as yaml from 'js-yaml'
import axios, { isAxiosError } from 'axios'

async function validateSubscription(): Promise<void> {
  const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`;

  try {
    await axios.get(API_URL, {timeout: 3000});
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error('Subscription is not valid. Reach out to support@stepsecurity.io');
      process.exit(1);
    } else {
      core.info('Timeout or API not reachable. Continuing to next step.');
    }
  }
}

const run = async () => {
    try {
        await validateSubscription();
        const file = core.getInput('file')
        const keys: string[] = JSON.parse(core.getInput('key-path'))

        const content = await fs.readFile(file, 'utf8')

        let yamlData = yaml.load(content) as Record<string, any>

        if (yamlData == null || yamlData == undefined) {
            core.setFailed('Error in reading the yaml file')
            return
        }

        let output = keys.reduce((dict: any, key) => dict[key], yamlData)
        core.setOutput('data', output)
    } catch (error) {
        core.setFailed((error as Error).message)
    }
}

run()
