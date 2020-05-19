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
import regression from 'regression';
import { ThemeContextConsumer } from "../../ThemeContextProvider";

var _ = require('lodash');
var moment = require('moment');

const colorSet = ["primary", "warning", "success", "danger", "info"];
const colorCode = [getStyle('--primary'), getStyle('--warning'), getStyle('--success'), getStyle('--danger'), getStyle('--info')];

var A, B, C;
var errors = [];

class Cases extends Component {
  constructor(props) {
    super(props);
    this.train = this.train.bind(this);
    this.predict = this.predict.bind(this);

    this.state = {
      maxConfirmed : 180000,
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
                max: 300000,
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

  onCountryChange(context, selectedCountry) {
    if(selectedCountry.target.value !== ''){
      let inputs = this.state.inputs;
      inputs.selectedCountries.push(selectedCountry.target.value);
      this.setState({
        inputs : inputs,
      });
    }

    this.drawCovidGraph(context);
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
    });

    this.drawCovidGraph(context)
  }

  onMaxConfirmedChange(context, e){
    if(e.target.value !== ''){
      this.setState({
        maxConfirmed : e.target.value,
      });
    }

    this.drawCovidGraph(context);
  }

  drawCovidGraph(context){
    let self = this;
    let allDataObject = context.allDataObject;
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
    today.setDate(today.getDate() + 100);

    while(minDate < today) {
      mainChart.labels.push(moment(minDate).format('DD/MM/YYYY'));
      minDate.setDate(minDate.getDate() + 1);
    }

    let index = 0;
    let xIndex = 0;
    let dataForLogistic = [];
    let xDataForLogistic = [];
    let yDataForLogistic = [];
    graphData.forEach(function (data) {
      let countryConfirmedData = [];
      let previousNumber = 0;
      mainChart.labels.forEach(function (date) {
        let countryDataAtDate = _.find(data.cases, ['Date', moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD')]);
        if(countryDataAtDate !== undefined){
          countryConfirmedData.push(countryDataAtDate.Confirmed);
          previousNumber = countryDataAtDate.Confirmed;
          dataForLogistic.push([xIndex, countryDataAtDate.Confirmed]);
          yDataForLogistic.push(countryDataAtDate.Confirmed);
        } else {
          countryConfirmedData.push(previousNumber);
          dataForLogistic.push([xIndex, previousNumber])
          yDataForLogistic.push(previousNumber);
        }
        xDataForLogistic.push(xIndex);
        xIndex++;
      });
      let result = regression.polynomial(dataForLogistic, { order: 3 });
      let gradient = result.equation[0];
      let yIntercept = result.equation[1];

      if(self.state.radioSelected === 1){
        countryConfirmedData = ma(countryConfirmedData, 3);
      } else if(self.state.radioSelected === 2){
        countryConfirmedData = ema(countryConfirmedData, 3);
      } else if(self.state.radioSelected === 3){
        countryConfirmedData = wma(countryConfirmedData, 3);
      }

      //epochs = 500;
      //alpha = 0.2;
      self.train(500, 0.2, yDataForLogistic);

      let predictedConfirmedData = [];
      let predictIndex = 0;
      countryConfirmedData.forEach(function (data) {
        //predictedConfirmedData.push(result.predict(predictIndex)[1]);
        predictedConfirmedData.push(self.predict(predictIndex));
        predictIndex++;
      });

      for(var i=0; i<100; i++){
        predictedConfirmedData.push(self.predict(predictIndex + i));
      }

      mainChart.datasets.push({
        label: data.CountryName,
        backgroundColor: 'transparent',
        borderColor: colorCode[index],
        pointHoverBackgroundColor: '#fff',
        borderWidth: 2,
        data: countryConfirmedData,
      });
      mainChart.datasets.push({
        label: 'Prediction',
        backgroundColor: 'transparent',
        borderColor: colorCode[index+1],
        pointHoverBackgroundColor: '#fff',
        borderWidth: 2,
        data: predictedConfirmedData,
      });
      index++;
    });

    this.setState({
      mainChart : mainChart,
    });

  }

  train(epochs, alpha, data){
      errors =[];
      A = 0.0;
      B = 0.0;
      C = 0.0;

      for (var i=0; i<epochs; i++){
          var error;
          let trainIndex = 0;
          data.forEach(d=>{
              var predY;
              var func;
              func = A*Math.pow(trainIndex, 1.85)/100+B*trainIndex/100+C;
              predY = 1/(1+Math.exp(-func));
              error = predY - d/this.state.maxConfirmed;

              A = A + alpha*-error*predY*(1-predY)*Math.pow(trainIndex, 1.85)/100;
              B = B + alpha*-error*predY*(1-predY)*trainIndex/100;
              C = C + alpha*-error*predY*(1-predY)*1.0;

              trainIndex++;
              // errors.push({error:error, iteration:count});
          })

          errors.push({error:error, epoch:i});

          var accuracy = 1+Math.round(error*100)/100;

          var progresspercent = 100*i/500;
      }
  }

  predict(x1){
    var predY;
    var func;
    func = A*Math.pow(x1, 1.85)/100+B*x1/100+C;
    predY = this.state.maxConfirmed/(1+Math.exp(-func));

    return predY;
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
                        <Input disabled={this.state.inputs.selectedCountries.length > 0 ? true : false} type="select" name="countries" id="countries" bsSize="sm" value={this.state.inputs.selectedCountry} onChange={this.onCountryChange.bind(this, context)}>
                          <option value="">Please add a country</option>
                          {
                            context.countries.map((r , i) => <option key={i} value={r.Key}>{r.CountryName}</option>)
                          }
                        </Input>
                      </Col>
                    </FormGroup>
                    <Row>
                    {
                      this.state.inputs.selectedCountries.map((r , i) =>
                        <Alert className="mb-0 mr-1 pr-5" key={r + i} color={i < 5 ? colorSet[i] : colorSet[4]} isOpen={true} toggle={this.onDismiss.bind(this, r, context)}>
                          <div>{context.allDataObject[r].CountryName}</div>
                        </Alert>
                      )
                    }
                    </Row>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col sm="3">
                        <CardTitle className="mb-0">Covid-19 Cases</CardTitle>
                        <div className="small text-muted">2020</div>
                      </Col>
                      <Col sm="3">
                        <FormGroup>
                          <Label htmlFor="name">Prediction Number</Label>
                          <Input type="text" id="maxConfirmed" name="maxConfirmed" value={this.state.maxConfirmed} placeholder="Enter max confirmed" onChange={this.onMaxConfirmedChange.bind(this, context)} />
                        </FormGroup>
                      </Col>
                      <Col sm="6" className="d-none d-sm-inline-block">
                        <ButtonToolbar className="float-right" aria-label="Toolbar with button groups">
                          <ButtonGroup className="mr-3" aria-label="First group">
                            <Button className="text-dark" color="outline-primary" onClick={() => this.onRadioBtnClick(0, context)} active={this.state.radioSelected !== 0}>Normal</Button>
                            <Button className="text-dark" color="outline-primary" onClick={() => this.onRadioBtnClick(1, context)} active={this.state.radioSelected !== 1}>MA</Button>
                            <Button className="text-dark" color="outline-primary" onClick={() => this.onRadioBtnClick(2, context)} active={this.state.radioSelected !== 2}>EMA</Button>
                            <Button className="text-dark" color="outline-primary" onClick={() => this.onRadioBtnClick(3, context)} active={this.state.radioSelected !== 3}>WMA</Button>
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
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </ThemeContextConsumer>
    );
  }
}

export default Cases;
