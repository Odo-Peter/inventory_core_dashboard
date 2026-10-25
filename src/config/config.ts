type Environment = 'production' | 'staging' | 'development';

const PRODUCTION_HOST = 'stocktake.com';
const STAGING_HOST = 'staging.stocktake.com';

const STAGING_PORTS = ['8080', '8443'];

export const getEnvironment = (
  host: string = window.location.hostname,
  port: string = window.location.port,
): Environment => {
  if (host === PRODUCTION_HOST && port === '') {
    return 'production';
  }
  if (host === STAGING_HOST || STAGING_PORTS.includes(port)) {
    return 'staging';
  }

  return 'development';
};

export function getApiBaseUrl(): string {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  if (backendUrl) {
    return backendUrl.endsWith('/') ? backendUrl : `${backendUrl}/`;
  }

  const { protocol, hostname, port } = window.location;
  const host = port ? `${hostname}:${port}` : hostname;

  return `${protocol}//${host}/v1/`;
}
