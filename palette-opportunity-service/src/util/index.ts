import axios from 'axios';

const _requester = ({
  apiGatewayId = process.env.PALETTE_API_GATEWAY_ID,
  region = process.env.PALETTE_AWS_REGION,
  resourcePath,
}) => {
  const stage = 'dev';
  const endPoint = `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/${stage}/${resourcePath}`;
  return endPoint;
};

export const getServiceData = async (
  { resource, authHeader },
  local?: { path: string },
) => {
  let executionPath = '';
  if (local && local.path) {
    executionPath = local.path;
  } else {
    executionPath = _requester({ resourcePath: resource });
  }

  const res = (
    await axios.get(executionPath, {
      headers: {
        authorization: authHeader,
      },
    })
  ).data;

  console.log('AX RESP - ', res);

  if (res.error) {
    throw new Error(res.error);
  }

  return res.data;
};
