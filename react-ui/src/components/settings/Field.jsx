import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TextField from 'material-ui/TextField';

const styles = {
  fieldContainer: {
    display: 'flex',
    margin: 20,
    marginTop: 0,
  },
  fieldIcon: {
    height: 35,
    width: 'auto',
    marginTop: 'auto',
    marginBottom: 7,
    marginLeft: 0,
    marginRight: 30,
  },
  fieldText: {
    flex: 1,
    marginRight: 30,
  },
}


const Field = ({
  name,
  value,
  isEditing,
  onChange,
  Icon,
  errorText,
  type,
}) => (
  <div style={ styles.fieldContainer }>
    <Icon style={ styles.fieldIcon } />
    <TextField
      id={ name }
      floatingLabelText={ name }
      value={ value }
      type={ type }
      errorText={ errorText }
      disabled={ !isEditing }
      onChange={ onChange }
      style={ styles.fieldText }
    />
  </div>
);

Field.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  Icon: PropTypes.func.isRequired,
  errorText: PropTypes.string,
  type: PropTypes.string,
};

Field.defaultProps = {
  errorText: '',
  type: '',
};

export default Field;