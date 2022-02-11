import { Request } from "express"
import { renderToStringWithData } from "@galoymoney/client"

import config from "../store/config"
import { createClient } from "../store"
import { appRoutes, authRoutes } from "../server/routes"

import { SSRRoot } from "../components/root"

export const serverRenderer =
  (req: Request) =>
  async ({
    path,
    flowData,
  }: {
    path: RoutePath | AuthRoutePath
    flowData?: KratosFlowData
  }) => {
    try {
      const galoyJwtToken = req.session?.galoyJwtToken

      const GwwState: GwwState = {
        path,
        props: req.query,
        key: 0,
        defaultLanguage: req.acceptsLanguages()?.[0],
        flowData,
      }

      const galoyClient = createClient({
        authToken: galoyJwtToken,
        headers: req.headers,
      })
      const App = (
        <SSRRoot
          client={galoyClient}
          GwwState={GwwState}
          galoyJwtToken={galoyJwtToken}
          flowData={flowData}
        />
      )

      const initialMarkup = await renderToStringWithData(App)
      const ssrData = galoyClient.extract()

      const { supportEmail, graphqlUri, graphqlSubscriptionUri, network, authEndpoint } =
        config

      return Promise.resolve({
        GwwState,
        GwwConfig: {
          supportEmail,
          graphqlUri,
          graphqlSubscriptionUri,
          network,
          authEndpoint,
        },
        initialMarkup,
        ssrData,
        pageData:
          flowData === undefined
            ? appRoutes[path as RoutePath]
            : authRoutes[path as AuthRoutePath],
      })
    } catch (err) {
      console.error(err)
    }
  }
