import React, { Component } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Row,
  Table,
} from 'reactstrap';

import { CustomTooltips } from '@coreui/coreui-plugin-chartjs-custom-tooltips';
import { ThemeContextConsumer } from "../../ThemeContextProvider";

const axios = require('axios');
var Loader = require('react-loader');

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
     continentalData : [],
    };
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  componentDidMount() {
    let self = this;
    let bar = this.state.bar;
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

    axios.get('https://corona.lmao.ninja/v2/continents?yesterday=true')
      .then(function ({ data }) {
        let continentalData = data;
        axios.get('https://corona.lmao.ninja/v2/countries?yesterday=true&sort=todayCases')
          .then(function ({ data }) {
            for(let i = 0; i < 10; i++) {
                bar.datasets[0].data.push(data[i].todayCases);
                bar.datasets[1].data.push(data[i].todayDeaths);
                bar.labels.push(data[i].country);
            }
            self.setState({
              bar : bar,
              continentalData : continentalData,
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
                      <i className="fa fa-ambulance"></i> Continental Covid Stats Per One Million
                    </CardHeader>
                    <CardBody>
                      <Table responsive striped>
                        <thead>
                          <tr>
                            <th>Continent</th>
                            <th>Cases</th>
                            <th>Deaths</th>
                            <th>Tests</th>
                          </tr>
                        </thead>
                        <tbody>
                          {
                            this.state.continentalData.map((r , i) =>
                              <tr>
                                <td>{r.continent}</td>
                                <td>{r.casesPerOneMillion}</td>
                                <td>{r.deathsPerOneMillion}</td>
                                <td>{r.testsPerOneMillion}</td>
                              </tr>
                            )
                          }
                        </tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </Col>
                <Col md="6">
                  <Card>
                    <CardHeader>
                      <i className="fa fa-ambulance"></i> Countries With The Most New Cases
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
