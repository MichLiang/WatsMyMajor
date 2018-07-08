import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Tree from 'react-tree-graph';
import Dimensions from 'react-dimensions'

// We need a component because react-dimensions will complain if we use a
// stateless presentational component.
class PrerequisitesTree extends Component {
  static propTypes = {
    data: PropTypes.object,
    containerHeight: PropTypes.number.isRequired,
    containerWidth: PropTypes.number.isRequired,
  };

  render() {
    const { data, containerWidth, containerHeight } = this.props;
    return (
      <Tree
        data={data}
        height={containerHeight}
        width={containerWidth}
        nodeOffset={5}
        nodeRadius={10}
        margins={{
          bottom: 50,
          left: 50,
          right: 200,
          top: 50
        }}
        svgProps={{ className: 'tree' }}
        keyProp="id"
        animated
      />
    );
  }
}

export default Dimensions()(PrerequisitesTree);
