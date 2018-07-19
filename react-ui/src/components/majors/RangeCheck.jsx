import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Checkbox from 'material-ui/Checkbox';
import { getTakenCoursesInRange } from '../../utils/courses';


const styles = {
  iconStyle: {
    left: 0,
  },
  labelStyle: {
    width: '100%',
    color: 'inherit'
  },
  checkbox: {
    marginTop: 10,
    width: 'auto',
    marginLeft: 20,
    textAlign: 'left',
  },
  indentedChecks: {
    marginTop: 0,
    marginLeft: 50,
  },
  innerChecks: {
    width: 'auto',
    textAlign: 'left',
  },
  innerIcon: {
    left: 0,
    width: 20,
  }
};

export default class RangeCheck extends Component {
  static propTypes = {
    subject: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    choose: PropTypes.number.isRequired,
    excluding: PropTypes.array.isRequired,
    myCourses: PropTypes.object.isRequired,
    onCheck: PropTypes.func.isRequired,
  };

  state = {
    taken: false,
    isChecked: false,
    children: [],
  };

  componentDidMount() {
    const { subject, from, to, excluding, myCourses, choose } = this.props;
    const children = Array.from(Array(choose).keys()).map(() =>
      ({ subject: '', catalogNumber: '', checked: false}));
    this.setState({ children });
    this.checkTaken(subject, from, to, excluding, children, myCourses);
  }

  componentWillReceiveProps(nextProps) {
    const { subject, from, to, excluding, myCourses } = nextProps;
    if (subject !== this.props.subject
      || from !== this.props.from
      || to !== this.props.to) {
      this.checkTaken(subject, from, to, excluding, this.state.children, myCourses);
    }
  }

  checkTaken = (subject, from, to, excluding, children, myCourses) => {
    const takenCourses = getTakenCoursesInRange(subject, from, to, excluding, myCourses);
    if (takenCourses.length === 0) return;

    // If course is taken, increment count by 1
    if (this.props.choose === 1) {
      this.props.onCheck(null, true);
      this.setState({ taken: true, isChecked: true });
    } else {
      this.props.onCheck(null, true, takenCourses.length);
      takenCourses.forEach((catalogNumber, index) => {
        children[index] = { subject, catalogNumber, checked: true };
      });
      this.setState({ children });
    }
  }

  onCheck = (index, ev, isChecked) => {
    // Toggle main checkbox
    if (index === -1) {
      this.setState({ isChecked });
    } else {
      const { children } = this.state;
      children[index].checked = isChecked;
      this.setState({ children });
      this.props.onCheck(ev, isChecked);
    }
  }

  render() {
    const { subject, from, to, choose, excluding } = this.props;
    const excludingStr = (excluding.length > 0) ? ` (excl. ${excluding.join(',')})` : '';
    return (
      <div>
        <Checkbox
          label={ `${subject} ${from} - ${subject} ${to}${excludingStr}`}
          checked={ this.state.isChecked }
          onCheck={ this.onCheck.bind(this, -1) }
          iconStyle={ styles.iconStyle }
          labelStyle={ styles.labelStyle }
          style={ styles.checkbox }
          disabled={ choose > 1 || this.state.taken }
        />
        { (choose > 1) && (
          <div style={ styles.indentedChecks }>
            { Array.from(Array(choose).keys()).map((_, index) => {
              const child = this.state.children[index];
              const label = (child) ? `${child.subject} ${child.catalogNumber}` : '';
              const checked = (child) ? child.checked : false;
              return (
                <Checkbox
                  key={ index }
                  label={ label }
                  checked={ checked }
                  onCheck={ this.onCheck.bind(this, index) }
                  labelStyle={ styles.labelStyle }
                  iconStyle={ styles.innerIcon }
                  style={ styles.innerChecks }
                />
              );
            }) }
          </div>
        ) }
      </div>
    );
  }
}
