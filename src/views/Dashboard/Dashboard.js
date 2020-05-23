import React, { Component } from 'react';
import { Bar, Polar } from 'react-chartjs-2';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Row,
} from 'reactstrap';

import { CustomTooltips } from '@coreui/coreui-plugin-chartjs-custom-tooltips';
import { ThemeContextConsumer } from "../../ThemeContextProvider";

const axios = require('axios');
var Loader = require('react-loader');

const colorSet = ['255,0,0', '0,255,0', '0,0,255', '255,255,0', '0,255,255', '255,0,255'];
const options = {
  tooltips: {
    enabled: false,
    custom: CustomTooltips
  },
  responsive: true,
  maintainAspectRatio: false,
  animation: {
      duration: 0
  },
  hover: {
      animationDuration: 0
  },
  responsiveAnimationDuration: 0
}

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      radar : {
        labels: ['Cases Per 100.000', 'Deaths Per One Million', 'Tests Per 10.000', 'Active Per 100.000', 'Recovered Per 100.000', 'Critical Per Ten Million'],
        datasets: [],
      },
      bar : {
       labels: ['North America', 'Europe', 'South America', 'Asia', 'Africa', 'Australia/Oceania'],
       datasets: [{
         label: 'Today Cases',
         backgroundColor: 'rgba(255,99,132,0.2)',
         borderColor: 'rgba(255,99,132,1)',
         borderWidth: 1,
         hoverBackgroundColor: 'rgba(255,99,132,0.4)',
         hoverBorderColor: 'rgba(255,99,132,1)',
         data: [0,0,0,0,0,0],
       },
       {
         label: 'Today Deaths',
         backgroundColor: 'rgba(179,181,198,0.2)',
         borderColor: 'rgba(179,181,198,1)',
         borderWidth: 1,
         hoverBackgroundColor: 'rgba(179,181,198,0.4)',
         hoverBorderColor: 'rgba(179,181,198,1)',
         data: [0,0,0,0,0,0],
       }],
     },
     polar : {
       labels: ['North America', 'Europe', 'South America', 'Asia', 'Africa', 'Australia/Oceania'],
       datasets: [{
         data: [0,0,0,0,0,0],
         backgroundColor: [
           '#f86c6b',
           '#ffc107',
           '#20a8d8',
           '#4dbd74',
           '#2f353a',
           '#c8ced3',
         ],
         label: 'My dataset',
       }],
     }
    };
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  componentDidMount() {
    let self = this;
    let radar = this.state.radar;
    let bar = this.state.bar;
    let polar = this.state.polar;
    bar.datasets = [
      {
        label: 'Today Cases',
        backgroundColor: 'rgba(255,99,132,0.2)',
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(255,99,132,0.4)',
        hoverBorderColor: 'rgba(255,99,132,1)',
        data: [],
      },
      {
        label: 'Today Deaths',
        backgroundColor: 'rgba(179,181,198,0.2)',
        borderColor: 'rgba(179,181,198,1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(179,181,198,0.4)',
        hoverBorderColor: 'rgba(179,181,198,1)',
        data: [],
      }
    ];
    bar.labels = [];

    polar.datasets = [
      {
        data: [],
        backgroundColor: [
          '#f86c6b',
          '#ffc107',
          '#20a8d8',
          '#4dbd74',
          '#2f353a',
          '#c8ced3',
        ],
        label: 'My dataset',
      }];
    polar.labels = [];
    axios.get('https://corona.lmao.ninja/v2/continents?yesterday=true')
      .then(function ({ data }) {
        let i = 0;
        data.forEach(function (continent) {
          radar.datasets.push(
            {
              label: continent.continent,
              backgroundColor: 'rgba(' + colorSet[i] + ',0.2)',
              borderColor: 'rgba(' + colorSet[i] + ',1)',
              pointBackgroundColor: 'rgba(' + colorSet[i] + ',1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(' + colorSet[i] + ',1)',
              data: [continent.casesPerOneMillion/10, continent.deathsPerOneMillion, continent.testsPerOneMillion/100, continent.activePerOneMillion/10, continent.recoveredPerOneMillion/10, continent.criticalPerOneMillion*10],
            }
          );
          polar.datasets[0].data.push(continent.casesPerOneMillion);
          polar.labels.push(continent.continent);
          i++;
        });
        axios.get('https://corona.lmao.ninja/v2/countries?yesterday=true&sort=todayCases')
          .then(function ({ data }) {
            for(let i = 0; i < 10; i++) {
                bar.datasets[0].data.push(data[i].todayCases);
                bar.datasets[1].data.push(data[i].todayDeaths);
                bar.labels.push(data[i].country);
            }
            self.setState({
              bar : bar,
              radar : radar,
              //polar : polar,
            });
          })
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
  }

  render() {

    return (
      <ThemeContextConsumer>
        {context => (
          <Loader loaded={context.removeLoadingBar}>
            <div className="animated fadeIn">
              <Row>
                <Col md="6">
                  <Card>
                    <CardHeader>
                      Continental Covid Cases Per One Million
                    </CardHeader>
                    <CardBody>
                      <div className="chart-wrapper">
                        <Polar data={this.state.polar} options={options}/>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
                <Col md="6">
                  <Card>
                    <CardHeader>
                      Countries With The Most New Cases
                    </CardHeader>
                    <CardBody>
                      <div className="chart-wrapper">
                        <Bar data={this.state.bar} options={options} />
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </div>
          </Loader>
        )}
      </ThemeContextConsumer>
    );
  }
}

export default Dashboard;
