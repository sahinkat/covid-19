import data_metadata from './data/metadata';
import data_test from './data/data_test';
import React, { Component } from "react";
const { Provider, Consumer } = React.createContext();
const axios = require('axios');

const _ = require('lodash');
const moment = require('moment');
const getCountryISO3 = require("country-iso-2-to-3");

class ThemeContextProvider extends Component {
  state = {
    allDataObject : {
      "TR" : {
        "Key":"TR",
        "CountryCode":"TR",
        "CountryName":"Turkey",
        "RegionCode":null,
        "RegionName":null,
        "Latitude":"38.963745",
        "Longitude":"35.243322",
        "Population":83429615,
        "cases" : [
          {
            "Date":"YYYY-MM-DD",
            "Key": "TR",
            "Confirmed":0.0,
            "Deaths":0.0,
            "NewCases":0.0,
            "NewDeaths":0.0,
            "NewMild":0.0,
            "NewSevere":0.0,
            "NewCritical":0.0,
            "CurrentlyMild":0.0,
            "CurrentlySevere":0.0,
            "CurrentlyCritical":0.0
          }
        ],
        "mobilityData" : [
          {
            "Date":"YYYY-MM-DD",
            "Key": "TR",
            "RetailAndRecreation":0.0,
            "GroceryAndPharmacy":0.0,
            "Parks":0.0,
            "TransitStations":0.0,
            "Workplaces":0.0,
            "Residential":0.0
          }
        ],
      }
    },
    countries : [
      {
        "Key":"TR",
        "CountryCode":"TR",
        "CountryName":"Turkey",
      }
    ]
  };

  componentDidMount() {
    this.refreshCovidData();
  }

  refreshCovidData = () => {
    let self = this;
    let allDataObject = {};
    let countries = [];
    let metadataAll = data_metadata();
    metadataAll.forEach(country => {
      allDataObject[country["Key"]] = country;
      if(country["Key"].length < 3) {
        countries.push({
          "Key":country["Key"],
          "CountryCode":country["CountryCode"],
          "CountryName":country["CountryName"]
        });
      }
    });

    this.setState({
      allDataObject : allDataObject,
      countries     : countries
    });

    //self.getCases();
    //this.getMobilityData();
  };

  getCases() {
    let self = this;
    let testDataAll = data_test();

    axios.get('https://open-covid-19.github.io/data/data_minimal.json')
      .then(function ({ data }) {
        let data_minimal = data;
        axios.get('https://open-covid-19.github.io/data/data_categories.json')
          .then(function ({ data }) {
            let data_categories = data;
            let concattedCaseData = _(data_minimal)
                                .concat(data_categories)
                                .groupBy("Key")
                                .mapValues(function(values) {
                                  return _(values)
                                        .groupBy("Date")
                                        .map(objs => _.assignWith({}, ...objs, (val1, val2) => val1 || val2))
                                        .value();
                                }).value();
            let allDataObject = self.state.allDataObject;
            Object.keys(allDataObject).forEach(function(key) {
              let countryTestData = _.filter(testDataAll, {"Code":getCountryISO3(key)});
              if(concattedCaseData[key] !== undefined && countryTestData !== undefined && countryTestData.length > 0){
                concattedCaseData[key].forEach(function(caseData) {
                  if(caseData !== undefined){
                    let countryTestDataAtDate = _.find(countryTestData, function(e) {
                      return moment(caseData["Date"], 'YYYY-MM-DD').isSame(moment(e["Date"], 'll'), 'day');
                    });
                    if(countryTestDataAtDate !== undefined && countryTestDataAtDate["Total tests"] > 0){
                      caseData["Tests"] = countryTestDataAtDate["Total tests"];
                    }
                  }
                });
              }
              allDataObject[key].cases = concattedCaseData[key];
            });

            self.setState({
              allDataObject : allDataObject,
            });
          })
          .catch(function (error) {
            // handle error
            console.log(error);
          });
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
  }

  getMobilityData() {
    let self = this;
    axios.get('https://open-covid-19.github.io/data/mobility.json')
      .then(function ({ data }) {
        let allDataObject = self.state.allDataObject;
        Object.keys(allDataObject).forEach(function(key) {
          allDataObject[key].mobilityData = _.filter(data, {"Key":key});
        });

        self.setState({
          allDataObject : allDataObject,
        });
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
  }

  render() {
    return (
      <Provider value={
        {
          allDataObject: this.state.allDataObject,
          countries: this.state.countries,
          refreshCovidData: this.refreshCovidData
        }
      }>
        {this.props.children}
      </Provider>
    );
  }
}

export { ThemeContextProvider, Consumer as ThemeContextConsumer };
