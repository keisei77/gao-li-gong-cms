import React from 'react';
import { connect } from 'dva';
import { Card, Row, Col } from 'antd';

import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import { host } from '@/components/ImgUpload';

import styles from './index.less';

const StarAnimals = ({ animals = [], history, dispatch }) => {
  dispatch({
    type: 'fetch',
  });

  const getUrl = urlstr => {
    try {
      return urlstr.split(',')[0].replace('"', '');
    } catch (e) {
      return urlstr;
    }
  };

  return (
    <React.Fragment>
      <PageHeaderWrapper />
      <Card bordered={false} style={{ marginTop: '1em' }} className={styles.editAnimal}>
        <Row className="star-animal" type="flex" justify="space-around">
          {animals.map(animal => (
            <Col key={animal.name} onClick={() => history.push(`/starAnimals/edit/${animal.name}`)}>
              <Card
                hoverable
                style={{ width: 250, height: 330 }}
                cover={
                  <img
                    alt="example"
                    style={{ height: '100%', width: 'auto' }}
                    src={`${getUrl(animal.imgUrl)}`}
                  />
                }
              >
                <Card.Meta title={animal.name} description={animal.brief} />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </React.Fragment>
  );
};

const mapStateToProps = state => {
  return {
    animals: state.starAnimals.animals,
  };
};

export default connect(mapStateToProps)(StarAnimals);
