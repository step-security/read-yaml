import * as core from '@actions/core'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import axios, { isAxiosError } from 'axios'

async function validateSubscription(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH
  let repoPrivate: boolean | undefined

  if (eventPath && fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'))
    repoPrivate = eventData?.repository?.private
  }

  const upstream = 'jbutcher5/read-yaml'
  const action = process.env.GITHUB_ACTION_REPOSITORY
  const docsUrl =
    'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions'

  core.info('')
  core.info('[1;36mStepSecurity Maintained Action[0m')
  core.info(`Secure drop-in replacement for ${upstream}`)
  if (repoPrivate === false)
    core.info('[32m✓ Free for public repositories[0m')
  core.info(`[36mLearn more:[0m ${docsUrl}`)
  core.info('')

  if (repoPrivate === false) return

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
  const body: Record<string, string> = {action: action || ''}
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      {timeout: 3000}
    )
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `[1;31mThis action requires a StepSecurity subscription for private repositories.[0m`
      )
      core.error(
        `[31mLearn how to enable a subscription: ${docsUrl}[0m`
      )
      process.exit(1)
    }
    core.info('Timeout or API not reachable. Continuing to next step.')
  }
}

const run = async () => {
    try {
        await validateSubscription();
        const file = core.getInput('file')
        const keys: string[] = JSON.parse(core.getInput('key-path'))

        const content = await fs.promises.readFile(file, 'utf8')

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
