import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Alert,
  Button,
  ButtonGroup,
  ButtonToolbar,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Col,
  FormGroup,
  Input,
  Label,
  Progress,
  Row
} from 'reactstrap';
import { CustomTooltips } from '@coreui/coreui-plugin-chartjs-custom-tooltips';
import { getStyle } from '@coreui/coreui/dist/js/coreui-utilities';
import {
  ma, ema, wma
} from 'moving-averages'

var _ = require('lodash');
var moment = require('moment');
const axios = require('axios');

const colorSet = ["primary", "warning", "success", "danger", "info"];
const colorCode = [getStyle('--primary'), getStyle('--warning'), getStyle('--success'), getStyle('--danger'), getStyle('--info')];

class Cases extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mainChartOpts : {
        tooltips: {
          enabled: false,
          custom: CustomTooltips,
          intersect: true,
          mode: 'index',
          position: 'nearest',
          callbacks: {
            labelColor: function(tooltipItem, chart) {
              return { backgroundColor: chart.data.datasets[tooltipItem.datasetIndex].borderColor }
            }
          }
        },
        maintainAspectRatio: false,
        legend: {
          display: false,
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                drawOnChartArea: false,
              },
            }],
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                maxTicksLimit: 40,
                stepSize: 1000,
                max: 130000,
              },
            }],
        },
        elements: {
          point: {
            radius: 0,
            hitRadius: 10,
            hoverRadius: 4,
            hoverBorderWidth: 3,
          },
        },
      },
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
      ],
      inputs : {
        selectedCountry   : "",
        selectedCountries : [],
      },
      mainChart : {
        labels: [],
        datasets: [],
      },
      radioSelected : 0,
    };
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  componentDidMount() {
    this.getCovidMetaData();
  }

  getCovidMetaData() {
    let self = this;
    axios.get('https://open-covid-19.github.io/data/metadata.json')
      .then(function ({ data }) {
          let allDataObject = {};
          let countries = [];
          data.forEach(country => {
            allDataObject[country["Key"]] = country;
            if(country["Key"].length < 3) {
              countries.push({
                "Key":country["Key"],
                "CountryCode":country["CountryCode"],
                "CountryName":country["CountryName"]
              });
            }
          });

          self.setState({
            allDataObject : allDataObject,
            countries     : countries
          });

          self.getCases();
          //self.getMobilityData();
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
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
            let allDataObject = self.state.allDataObject;
            Object.keys(allDataObject).forEach(function(key) {
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

  onCountryChange(selectedCountry) {
    if(selectedCountry.target.value !== ''){
      let inputs = this.state.inputs;
      inputs.selectedCountries.push(selectedCountry.target.value);
      this.setState({
        inputs : inputs,
      });
    }

    this.drawCovidGraph();
  }

  onDismiss(removedCountry, e) {
    if(removedCountry !== ''){
      let inputs = this.state.inputs;
      _.remove(inputs.selectedCountries, function (country) {
        return country === removedCountry;
      });
      this.setState({
        inputs : inputs,
      });
    }

    this.drawCovidGraph();
  }

  drawCovidGraph(){
    let self = this;
    let allDataObject = this.state.allDataObject;
    let selectedCountries = this.state.inputs.selectedCountries;
    let mainChart = this.state.mainChart;

    let graphData = [];
    mainChart.labels = [];
    mainChart.datasets = [];
    let strMinDate = "9999-99-99";
    selectedCountries.forEach(function (country) {
      let countryData = allDataObject[country];
      graphData.push(countryData);
      if(countryData.cases !== undefined && countryData.cases.length > 0) {
        if(strMinDate > countryData.cases[0].Date) {
          strMinDate = countryData.cases[0].Date;
        }
      }
    });
    let minDate = new Date(strMinDate);
    let today = new Date();

    while(minDate < today) {
      mainChart.labels.push(moment(minDate).format('DD/MM/YYYY'));
      minDate.setDate(minDate.getDate() + 1);
    }

    let index = 0;
    let maxValue = 0;
    graphData.forEach(function (data) {
      let countryConfirmedData = [];
      let previousNumber = 0;
      mainChart.labels.forEach(function (date) {
        let countryDataAtDate = _.find(data.cases, ['Date', moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD')]);
        if(countryDataAtDate !== undefined){
          countryConfirmedData.push(countryDataAtDate.Confirmed);
          previousNumber = countryDataAtDate.Confirmed;
        } else {
          countryConfirmedData.push(previousNumber);
        }
      });
      if(self.state.radioSelected === 1){
        countryConfirmedData = ma(countryConfirmedData, 3);
      } else if(self.state.radioSelected === 2){
        countryConfirmedData = ema(countryConfirmedData, 3);
      } else if(self.state.radioSelected === 3){
        countryConfirmedData = wma(countryConfirmedData, 3);
      }

      mainChart.datasets.push({
        label: data.CountryName,
        backgroundColor: 'transparent',
        borderColor: colorCode[index],
        pointHoverBackgroundColor: '#fff',
        borderWidth: 2,
        data: countryConfirmedData,
      });
      index++;
      let tempMaxValue = _.max(countryConfirmedData);
      if(maxValue < tempMaxValue){
        maxValue = tempMaxValue;
      }
    });
    let mainChartOpts = this.state.mainChartOpts;
    mainChartOpts.scales.yAxes.ticks = {
      beginAtZero: true,
      maxTicksLimit: 50,
      stepSize: Math.ceil(maxValue*1.1/50),
      max: Math.ceil(maxValue*1.1),
    };
    this.setState({
      mainChart : mainChart,
      mainChartOpts : mainChartOpts,
    });

  }

  onRadioBtnClick(e){
    this.setState({
      radioSelected : e,
    }, this.drawCovidGraph);
  }

  render() {

    return (
      <div className="animated fadeIn">
        <Row>
          <Col>
            <Card>
              <CardHeader>
                <FormGroup row>
                  <Col md="4">
                    <Label htmlFor="countries"><mark className="text-primary"><strong><small>*Countries</small></strong></mark></Label>
                    <Input type="select" name="countries" id="countries" bsSize="sm" value={this.state.inputs.selectedCountry} onChange={this.onCountryChange.bind(this)}>
                      <option value="">Please add a country</option>
                      {
                        this.state.countries.map((r , i) => <option key={i} value={r.Key}>{r.Key + " - " + r.CountryName}</option>)
                      }
                    </Input>
                  </Col>
                </FormGroup>
                <Row>
                {
                  this.state.inputs.selectedCountries.map((r , i) =>
                    <Alert className="mb-0 mr-1 pr-5" key={r + i} color={i < 5 ? colorSet[i] : colorSet[4]} isOpen={true} toggle={this.onDismiss.bind(this, r)}>
                      <div><i className={"h4 flag-icon flag-icon-" + r.toLowerCase()}  title={r} id={"flagId_" + r}></i>&nbsp;{r + " - " + this.state.allDataObject[r].CountryName}</div>
                    </Alert>
                  )
                }
                </Row>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col sm="5">
                    <CardTitle className="mb-0">Covid-19 Cases</CardTitle>
                    <div className="small text-muted">2020</div>
                  </Col>
                  <Col sm="7" className="d-none d-sm-inline-block">
                    <ButtonToolbar className="float-right" aria-label="Toolbar with button groups">
                      <ButtonGroup className="mr-3" aria-label="First group">
                        <Button className="text-dark" color="outline-primary" onClick={() => this.onRadioBtnClick(0)} active={this.state.radioSelected !== 0}>Normal</Button>
                        <Button className="text-dark" color="outline-primary" onClick={() => this.onRadioBtnClick(1)} active={this.state.radioSelected !== 1}>MA</Button>
                        <Button className="text-dark" color="outline-primary" onClick={() => this.onRadioBtnClick(2)} active={this.state.radioSelected !== 2}>EMA</Button>
                        <Button className="text-dark" color="outline-primary" onClick={() => this.onRadioBtnClick(3)} active={this.state.radioSelected !== 3}>WMA</Button>
                      </ButtonGroup>
                    </ButtonToolbar>
                  </Col>
                </Row>
                <div className="chart-wrapper" style={{ height: 400 + 'px', marginTop: 20 + 'px' }}>
                   {
                     <Line data={this.state.mainChart} options={this.state.mainChartOpts} height={400} />
                   }
                </div>
              </CardBody>
              <CardFooter>
                <Row className="text-center">
                  <Col sm={12} md className="mb-sm-2 mb-0">
                    <div className="text-muted">Visits</div>
                    <strong>29.703 Users (40%)</strong>
                    <Progress className="progress-xs mt-2" color="success" value="40" />
                  </Col>
                  <Col sm={12} md className="mb-sm-2 mb-0 d-md-down-none">
                    <div className="text-muted">Unique</div>
                    <strong>24.093 Users (20%)</strong>
                    <Progress className="progress-xs mt-2" color="info" value="20" />
                  </Col>
                  <Col sm={12} md className="mb-sm-2 mb-0">
                    <div className="text-muted">Pageviews</div>
                    <strong>78.706 Views (60%)</strong>
                    <Progress className="progress-xs mt-2" color="warning" value="60" />
                  </Col>
                  <Col sm={12} md className="mb-sm-2 mb-0">
                    <div className="text-muted">New Users</div>
                    <strong>22.123 Users (80%)</strong>
                    <Progress className="progress-xs mt-2" color="danger" value="80" />
                  </Col>
                  <Col sm={12} md className="mb-sm-2 mb-0 d-md-down-none">
                    <div className="text-muted">Bounce Rate</div>
                    <strong>Average Rate (40.15%)</strong>
                    <Progress className="progress-xs mt-2" color="primary" value="40" />
                  </Col>
                </Row>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Cases;
