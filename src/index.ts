import axios, { type AxiosResponse } from 'axios'
import type { SendEmailThroughProvider } from 'svag-emails'
import { pick } from 'svag-utils/dist/utils/pick'

export const createMakeRequestToBrevo = ({ apiKey, mock }: { apiKey?: string; mock?: boolean; skip?: boolean }) => {
  const makeRequestToBrevo = async ({
    path,
    data,
  }: {
    path: string
    data: Record<string, any>
  }): Promise<{
    originalResponse?: AxiosResponse
    loggableResponse: Pick<AxiosResponse, 'status' | 'statusText' | 'data'>
  }> => {
    if (mock) {
      return {
        loggableResponse: {
          status: 200,
          statusText: 'OK',
          data: { message: 'Brevo api mocked' },
        },
      }
    }
    if (!apiKey) {
      throw new Error('Brevo api key not provided')
    }
    const response = await axios({
      method: 'POST',
      url: `https://api.brevo.com/v3/${path}`,
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      data,
    })
    return {
      originalResponse: response,
      loggableResponse: pick(response, ['status', 'statusText', 'data']),
    }
  }

  return {
    makeRequestToBrevo,
  }
}

export const createSendSmsThroughBrevo = ({
  apiKey,
  fromSmsName,
  mock,
}: {
  fromEmailAddress?: string
  fromEmailName?: string
  fromSmsName?: string
  apiKey?: string
  mock?: boolean
}) => {
  const { makeRequestToBrevo } = createMakeRequestToBrevo({ apiKey, mock })

  const sendSmsThroughBrevo = async ({ to, text }: { to: string; text: string }) => {
    return await makeRequestToBrevo({
      path: 'transactionalSMS/sms',
      data: {
        type: 'transactional',
        unicodeEnabled: false,
        sender: fromSmsName || 'Test',
        recipient: to,
        content: text,
      },
    })
  }

  return {
    sendSmsThroughBrevo,
  }
}

export const createSendEmailThroughBrevo = ({
  apiKey,
  fromEmailAddress,
  fromEmailName,
  mock,
}: {
  fromEmailAddress?: string
  fromEmailName?: string
  apiKey?: string
  mock?: boolean
}) => {
  const { makeRequestToBrevo } = createMakeRequestToBrevo({ apiKey, mock })

  const sendEmailThroughBrevo: SendEmailThroughProvider = async ({
    to,
    subject,
    html,
  }: {
    to: string
    subject: string
    html: string
  }) => {
    return await makeRequestToBrevo({
      path: 'smtp/email',
      data: {
        subject,
        htmlContent: html,
        sender: { email: fromEmailAddress || 'test@example.com', name: fromEmailName || 'Test' },
        to: [{ email: to }],
      },
    })
  }

  return {
    sendEmailThroughBrevo,
  }
}

export const createBrevoThings = ({
  apiKey,
  fromEmailAddress,
  fromEmailName,
  fromSmsName,
  mock,
}: {
  fromEmailAddress?: string
  fromEmailName?: string
  fromSmsName?: string
  apiKey?: string
  mock?: boolean
}) => {
  const { makeRequestToBrevo } = createMakeRequestToBrevo({ apiKey, mock })
  const { sendEmailThroughBrevo } = createSendEmailThroughBrevo({ apiKey, fromEmailAddress, fromEmailName, mock })
  const { sendSmsThroughBrevo } = createSendSmsThroughBrevo({ apiKey, fromSmsName, mock })

  return {
    makeRequestToBrevo,
    sendEmailThroughBrevo,
    sendSmsThroughBrevo,
  }
}
