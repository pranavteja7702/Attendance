import Constants from './Constants';

export const test = async () => {
  return {status: 'success'};
};

export const apiCall = async (url, method, data, token, accessToken) => {
  var headers = Constants.HEADERS;
  headers['Authorization'] = 'Token ' + token;
  headers['module'] = accessToken;

  var obj = {
    method: method,
    headers: headers,
  };
  if (data != null) {
    obj['body'] = JSON.stringify(data);
  }

  const resp = await fetch(Constants.SERVER_CALL + url, obj)
    .then(res => {
      return res.json();
    })
    .then(async json => {
      return json;
    })
    .catch(error => {
      console.log(error);
      return {
        status: 'FAIL',
        message: error,
      };
    });

  return resp;
};
