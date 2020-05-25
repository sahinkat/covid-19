const axios = require('axios');
var moment = require('moment');

let _getCases = function (context, countryKey, callback) {
  let allDataObject = context.allDataObject;
  let country = allDataObject[countryKey];

  if(country.cases === undefined || country.cases.length === 0) {
    country.cases = [];
    axios.get('https://corona.lmao.ninja/v2/historical/' + country.CountryName + '?lastdays=365')
      .then(function ({ data }) {
        let cases = data.timeline.cases;
        let deaths = data.timeline.deaths;
        let previousCases = 0;
        let previousDeaths = 0;
        for (let key in cases) {
          if (cases.hasOwnProperty(key)) {
            country.cases.push(
              {
                "Date":moment(key, 'MM/DD/YYYY').format('YYYY-MM-DD'),
                "Key": countryKey,
                "Confirmed":cases[key] >= previousCases ? cases[key] : previousCases,
                "Deaths":deaths[key] | previousDeaths,
                "NewCases":cases[key] >= previousCases ? (cases[key] - previousCases) : 0,
                "NewDeaths":(deaths[key] - previousDeaths) | 0
              }
            );
            previousCases = cases[key];
            previousDeaths = deaths[key];
          }
        }

        allDataObject[countryKey] = country;
        context.allDataObject = allDataObject;
        callback(context);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
  } else {
    callback(context);
  }
};

export default {
    'getCases' : _getCases
};
