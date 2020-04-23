import React, { Component } from 'react';
import {
  Row,
} from 'reactstrap';

var _ = require('lodash');

const axios = require('axios');

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data : {
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
    };
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  componentWillMount() {

  }

  componentDidMount() {
    this.getCovidMetaData();
  }

  componentWillUpdate() {

  }

  componentDidUpdate() {

  }

  componentWillReceiveProps(newProps) {

  }

  getCovidMetaData() {
    let self = this;
    axios.get('https://open-covid-19.github.io/data/metadata.json')
      .then(function ({ data }) {
          data.forEach(country => self.setCovidMetaData(country));
          self.getCases();
          self.getMobilityData();
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
  }

  setCovidMetaData(country) {
    this.state.data[country["Key"]] = country;
  }

  getCases() {
    let self = this;
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
            Object.keys(self.state.data).forEach(function(key) {
              self.state.data[key].cases = concattedCaseData[key];
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
        Object.keys(self.state.data).forEach(function(key) {
          self.state.data[key].mobilityData = _.filter(data, {"Key":key});
        });
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
  }

  render() {

    return (
      <div className="animated fadeIn">
        <Row>


        </Row>
      </div>
    );
  }
}

export default Dashboard;
