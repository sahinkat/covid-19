import React, { Component } from 'react';
import { Bar, Doughnut, Line, Pie, Polar, Radar } from 'react-chartjs-2';
import {
  Alert,
  Button,
  ButtonGroup,
  ButtonToolbar,
  Card,
  CardBody,
  CardColumns,
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

import { ThemeContextConsumer } from "../../ThemeContextProvider";

const moment = require('moment');
const _ = require('lodash');
const axios = require('axios');

const colorSet = ['255,0,0', '0,255,0', '0,0,255', '255,255,0', '0,255,255', '255,0,255'];
const options = {
  tooltips: {
    enabled: false,
    custom: CustomTooltips
  },
  maintainAspectRatio: false
}

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      radar : {
        labels: ['Cases Per 100.000', 'Deaths Per One Million', 'Tests Per 10.000', 'Active Per 100.000', 'Recovered Per 100.000', 'Critical Per Ten Million'],
        datasets: [],
      }
    };
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  componentDidMount() {
    let self = this;
    let radar = this.state.radar;
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
          i++;
        });
        self.setState({
          radar : radar,
        });
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
          <div className="animated fadeIn">
            <CardColumns className="cols-2">
              <Card>
                <CardHeader>
                  Continental Covid Status
                </CardHeader>
                <CardBody>
                  <div className="chart-wrapper">
                    <Radar data={this.state.radar} />
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  Countries With The Most New Cases
                </CardHeader>
                <CardBody>
                  <div className="chart-wrapper">
                    <Bar data={bar} options={options} />
                  </div>
                </CardBody>
              </Card>
            </CardColumns>
          </div>
        )}
      </ThemeContextConsumer>
    );
  }
}

export default Dashboard;
