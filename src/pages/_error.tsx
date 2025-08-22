// src/pages/_error.tsx
import * as Sentry from '@sentry/nextjs'
import Error from 'next/error'
import { NextPageContext } from 'next'

// エラーページのプロパティ型定義
interface ErrorPageProps {
  statusCode: number
  hasGetInitialPropsRun?: boolean
  err?: Error
}

const CustomErrorComponent = (props: ErrorPageProps) => {
  return <Error statusCode={props.statusCode} />
}

// getInitialPropsでエラー情報を取得し、Sentryに送信
CustomErrorComponent.getInitialProps = async (contextData: NextPageContext) => {
  // Sentryのエラー処理を実行
  await Sentry.captureUnderscoreErrorException(contextData)

  // Error.getInitialPropsを呼び出してデフォルトの処理を実行
  const errorInitialProps = await Error.getInitialProps(contextData)

  return errorInitialProps
}

export default CustomErrorComponent
