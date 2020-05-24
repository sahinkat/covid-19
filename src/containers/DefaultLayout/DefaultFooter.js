import React, { Component } from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  children: PropTypes.node,
};

const defaultProps = {};

class DefaultFooter extends Component {
  render() {

    // eslint-disable-next-line
    const { children, ...attributes } = this.props;

    return (
      <React.Fragment>
        <span><a href="https://bau.edu.tr" target="_blank" rel="noopener noreferrer">Bahçeşehir University</a></span>
        <span className="ml-auto">Powered by <a href="https://bau.edu.tr/kadro/iktisadi_idari" target="_blank" rel="noopener noreferrer">Doç. Dr. Çağlar YURTSEVEN</a>&nbsp;&&nbsp;<a href="https://www.linkedin.com/in/sahin-katlan-b376111b" target="_blank" rel="noopener noreferrer">Şahin KATLAN</a></span>
      </React.Fragment>
    );
  }
}

DefaultFooter.propTypes = propTypes;
DefaultFooter.defaultProps = defaultProps;

export default DefaultFooter;
