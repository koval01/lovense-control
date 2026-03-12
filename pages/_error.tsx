import Error from 'next/error';
import type { NextPageContext } from 'next';

type ErrorPageProps = {
  statusCode: number;
};

export default function ErrorPage({ statusCode }: ErrorPageProps) {
  return <Error statusCode={statusCode} />;
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext): ErrorPageProps => {
  return {
    statusCode: res?.statusCode ?? err?.statusCode ?? 500,
  };
};
