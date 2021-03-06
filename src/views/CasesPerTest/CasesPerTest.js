import data_test from '../../data/data_test';
import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Alert,
  Button,
  ButtonGroup,
  ButtonToolbar,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  CardTitle,
  Col,
  FormGroup,
  Input,
  Label,
  Row
} from 'reactstrap';
import { CustomTooltips } from '@coreui/coreui-plugin-chartjs-custom-tooltips';
import { getStyle } from '@coreui/coreui/dist/js/coreui-utilities';
import {
  ma, ema, wma
} from 'moving-averages'

import { ThemeContextConsumer } from "../../ThemeContextProvider";
import AllDataUtils from '../../utils/AllDataUtils';

const moment = require('moment');
const _ = require('lodash');
const getCountryISO3 = require("country-iso-2-to-3");

const colorSet = ["primary", "warning", "success", "danger", "info"];
const colorCode = [getStyle('--primary'), getStyle('--warning'), getStyle('--success'), getStyle('--danger'), getStyle('--info')];
const mainChartOpts = {
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
};

class CasesPerTest extends Component {
  constructor(props) {
    super(props);

    this.state = {
      inputs : {
        selectedCountry   : "",
        selectedCountries : [],
        selectedTypeTotalNewChange : "NewCases"
      },
      mainChart : {
        labels: [],
        datasets: [],
      },
      radioSelected : 0,
    };
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  onTypeTotalNewChange(context, selectedTypeTotalNewChange) {
    if(selectedTypeTotalNewChange.target.value !== ''){
      let inputs = this.state.inputs;
      inputs.selectedTypeTotalNewChange = selectedTypeTotalNewChange.target.value;
      this.setState({
        inputs : inputs,
      });
    }

    this.drawCovidGraph(context);
  }

  onCountryChange(context, selectedCountry) {
    let self = this;
    selectedCountry = selectedCountry.target.value;
    if(selectedCountry !== ''){
      let testDataAll = data_test();
      let inputs = this.state.inputs;
      inputs.selectedCountries.push(selectedCountry);
      this.setState({
        inputs : inputs,
      });

      AllDataUtils.getCases(context, selectedCountry, function(newContext){
        let countryTestData = _.filter(testDataAll, {"Code":getCountryISO3(selectedCountry)});
        let concattedCaseData = newContext.allDataObject[selectedCountry].cases;
        let newConcattedCaseData = [];
        if(countryTestData !== undefined && countryTestData.length > 0){
          concattedCaseData.forEach(function(caseData) {
            if(caseData !== undefined){
              let countryTestDataAtDate = _.find(countryTestData, function(e) {
                return moment(caseData["Date"], 'YYYY-MM-DD').isSame(moment(e["Date"], 'll'), 'day');
              });
              if(countryTestDataAtDate !== undefined && countryTestDataAtDate["Total tests"] > 0){
                caseData["Tests"] = countryTestDataAtDate["Total tests"];
              }
              newConcattedCaseData.push(caseData);
            }
          });
        }
        newContext.allDataObject[selectedCountry].cases = newConcattedCaseData;
        self.drawCovidGraph(newContext);
      });
    }
  }

  onDismiss(removedCountry, context) {
    if(removedCountry !== ''){
      let inputs = this.state.inputs;
      _.remove(inputs.selectedCountries, function (country) {
        return country === removedCountry;
      });
      this.setState({
        inputs : inputs,
      });
    }

    this.drawCovidGraph(context);
  }

  onRadioBtnClick(e, context){
    this.setState({
      radioSelected : e,
    }, this.drawCovidGraph(context));
  }

  drawCovidGraph(context){
    let self = this;
    let allDataObject = context.allDataObject;
    let selectedCountries = this.state.inputs.selectedCountries;
    let selectedTypeTotalNewChange = this.state.inputs.selectedTypeTotalNewChange;
    let mainChart = this.state.mainChart;

    let graphData = [];
    mainChart.labels = [];
    mainChart.datasets = [];
    let strMinDate = "9999-99-99";
    selectedCountries.forEach(function (country) {
      let countryData = allDataObject[country];
      graphData.push(countryData);
      if(countryData.cases !== undefined && countryData.cases.length > 0) {
        let testsAvailableDates = _.filter(countryData.cases, function(e) {
          return e["Tests"] > 0;
        });
        if(testsAvailableDates !== undefined && testsAvailableDates.length > 0 && strMinDate > testsAvailableDates[0].Date) {
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
    let totalCasesFooter = 0;
    let totalDeathsFooter = 0;
    let totalTestsFooter = 0;
    let totalNewCasesFooter = 0;
    let totalNewDeathsFooter = 0;
    graphData.forEach(function (data) {
      let countryConfirmedData = [];
      let previousNumber = 0;
      let previousTestNumber = 1;
      let lastCountryData = {};
      mainChart.labels.forEach(function (date) {
        let countryDataAtDate = _.find(data.cases, ['Date', moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD')]);
        if(countryDataAtDate !== undefined){
          let countryDataTestsAtDate = countryDataAtDate.Tests;
          if(countryDataTestsAtDate !== undefined && countryDataTestsAtDate !== 0){
            countryConfirmedData.push(
              selectedTypeTotalNewChange === "NewCases" ?
              (countryDataAtDate[selectedTypeTotalNewChange] | 0) / (countryDataTestsAtDate - previousTestNumber) :
              (countryDataAtDate[selectedTypeTotalNewChange] | 0) / countryDataTestsAtDate
            );
            previousTestNumber = countryDataAtDate.Tests | 1;
          } else {
            countryConfirmedData.push(0);
          }
          previousNumber = countryDataAtDate[selectedTypeTotalNewChange] | 0;
          lastCountryData = countryDataAtDate;
          totalNewCasesFooter += lastCountryData["NewCases"] | 0;
          totalNewDeathsFooter += lastCountryData["NewDeaths"] | 0;
          totalTestsFooter = lastCountryData["Tests"] ? lastCountryData["Tests"] : totalTestsFooter;
        } else {
          countryConfirmedData.push(previousTestNumber > 1 ? previousNumber/previousTestNumber : 0);
        }
      });
      totalCasesFooter += lastCountryData["Confirmed"] | 0;
      totalDeathsFooter += lastCountryData["Deaths"] | 0;

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
    });

    this.setState({
      mainChart : mainChart,
      totalCasesFooter : totalCasesFooter,
      totalDeathsFooter : totalDeathsFooter,
      totalTestsFooter : totalTestsFooter,
      totalNewCasesFooter : totalNewCasesFooter,
      totalNewDeathsFooter : totalNewDeathsFooter
    });

  }

  render() {

    return (
      <ThemeContextConsumer>
        {context => (
          <div className="animated fadeIn">
            <Row>
              <Col>
                <Card>
                  <CardHeader>
                    <FormGroup row>
                      <Col md="4">
                        <Label htmlFor="countries"><mark className="text-primary"><strong><small>*Countries</small></strong></mark></Label>
                        <Input type="select" name="countries" id="countries" bsSize="sm" value={this.state.inputs.selectedCountry} onChange={this.onCountryChange.bind(this, context)}>
                          <option value="">Please add a country</option>
                          {
                            context.countries.map((r , i) => <option key={i} value={r.Key}>{r.CountryName}</option>)
                          }
                        </Input>
                      </Col>
                      <Col md="4">
                        <Label htmlFor="typeTotalNew"><mark className="text-primary"><strong><small>*Type</small></strong></mark></Label>
                        <Input type="select" name="typeTotalNew" id="typeTotalNew" bsSize="sm" value={this.state.inputs.selectedTypeTotalNewChange} onChange={this.onTypeTotalNewChange.bind(this, context)}>
                          <option value="NewCases">New Cases</option>
                          <option value="Confirmed">Confirmed</option>
                        </Input>
                      </Col>
                    </FormGroup>
                    <Row>
                    {
                      this.state.inputs.selectedCountries.map((r , i) =>
                        <Alert className="mb-0 mr-1 pr-5" key={r + i} color={i < 5 ? colorSet[i] : colorSet[4]} isOpen={true} toggle={this.onDismiss.bind(this, r, context)}>
                          <div><i className={"h4 flag-icon flag-icon-" + r.toLowerCase()}  title={r} id={"flagId_" + r}></i>&nbsp;{r + " - " + context.allDataObject[r].CountryName}</div>
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
                            <Button className="text-light" color="outline-primary" onClick={() => this.onRadioBtnClick(0, context)} active={this.state.radioSelected !== 0}>Normal</Button>
                            <Button className="text-light" color="outline-primary" onClick={() => this.onRadioBtnClick(1, context)} active={this.state.radioSelected !== 1}>MA</Button>
                            <Button className="text-light" color="outline-primary" onClick={() => this.onRadioBtnClick(2, context)} active={this.state.radioSelected !== 2}>EMA</Button>
                            <Button className="text-light" color="outline-primary" onClick={() => this.onRadioBtnClick(3, context)} active={this.state.radioSelected !== 3}>WMA</Button>
                          </ButtonGroup>
                        </ButtonToolbar>
                      </Col>
                    </Row>
                    <div className="chart-wrapper" style={{ height: 300 + 'px', marginTop: 20 + 'px' }}>
                       {
                         <Line data={this.state.mainChart} options={mainChartOpts} height={300} />
                       }
                    </div>
                  </CardBody>
                  <CardFooter>
                    <Row className="text-center">
                      <Col sm={12} md className="mb-sm-2 mb-0">
                        <div className="text-muted">Total Cases</div>
                        <strong>{this.state.totalCasesFooter}</strong>
                      </Col>
                      <Col sm={12} md className="mb-sm-2 mb-0 d-md-down-none">
                        <div className="text-muted">Total Deaths</div>
                        <strong>{this.state.totalDeathsFooter}</strong>
                      </Col>
                      <Col sm={12} md className="mb-sm-2 mb-0">
                        <div className="text-muted">Total Tests</div>
                        <strong>{this.state.totalTestsFooter}</strong>
                      </Col>
                      <Col sm={12} md className="mb-sm-2 mb-0">
                        <div className="text-muted">New Cases</div>
                        <strong>{this.state.totalNewCasesFooter}</strong>
                      </Col>
                      <Col sm={12} md className="mb-sm-2 mb-0 d-md-down-none">
                        <div className="text-muted">New Deaths</div>
                        <strong>{this.state.totalNewDeathsFooter}</strong>
                      </Col>
                    </Row>
                  </CardFooter>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </ThemeContextConsumer>
    );
  }
}

export default CasesPerTest;
