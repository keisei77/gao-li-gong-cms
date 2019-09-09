import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { FormattedMessage } from 'umi-plugin-react/locale';
import { Form, Input, Button, Card, Select, Tooltip, Icon } from 'antd';
import debounce from 'lodash/debounce';

import ImgUPload from '@/components/ImgUpload';
import RichTextEditor from '@/components/RichTextEditor';
import { buildTagsGroup } from './index';
import { tabList } from '../Tags/constant';

import styles from './Biology.less';

const FormItem = Form.Item;
const { TextArea } = Input;
const { Option } = Select;
const TypeMap = {
  MAIN: 'main',
  MINI: 'mini',
};
let labelsCache = new Map();

@Form.create()
@connect(({ loading, biology }) => ({
  submitting: loading.effects['form/submitRegularForm'],
  biology,
}))
class Biology extends PureComponent {
  constructor(props) {
    super(props);
    labelsCache = new Map(tabList.map(i => [i.tab, []]));
  }

  state = {
    miniImgList: [],
    mainImgList: [],
    tagsMap: new Map(),
    tagsList: [],
    loading: false,
  };

  componentDidMount() {
    const {
      dispatch,
      match: {
        params: { id },
      },
    } = this.props;

    if (+id) {
      dispatch({
        type: 'biology/fetchBiologyById',
        payload: { id },
        callback: ({ labels = [], imgUrl, thumbnails }) => {
          const miniImgList = thumbnails || [];
          const mainImgList = JSON.parse(imgUrl || '[]');
          const labelsList = Object.entries(buildTagsGroup(labels));
          [...labelsCache.keys()].forEach(key => {
            if (key in labelsList) {
              labelsCache.set(key, labelsList[key].map(l => l.id));
            }
          });

          this.setState({
            miniImgList,
            mainImgList,
            loading: true,
          });
        },
      });
    }

    dispatch({
      type: 'biology/fetchLabelList',
      payload: {},
      callback: (tags = []) => {
        const tagsMap = new Map();
        tags.forEach(t => tagsMap.set(t.id, t));
        const tagsList = buildTagsGroup(tags);

        this.setState({
          tagsMap,
          tagsList,
        });
      },
    });
  }

  handleSubmit = debounce(e => {
    const {
      dispatch,
      form,
      biology: { biology },
      history,
    } = this.props;

    e.preventDefault();
    form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        dispatch({
          type: 'biology/addBiology',
          payload: biology,
          callback: () => history.push('/biodiversity'),
        });
      }
    });
  }, 500);

  handleUploadChange = (fileList, type) => {
    const imgs = fileList.filter(f => f);
    switch (type) {
      case TypeMap.MAIN:
        this.setState({
          mainImgList: imgs,
        });
        this.handleChange(JSON.stringify(imgs), 'imgUrl');
        break;
      case TypeMap.MINI:
        this.setState({
          miniImgList: imgs,
        });
        this.handleChange(imgs, 'thumbnails');
        break;
      default:
        void 0;
    }
  };

  handleChange = (value, key, rest) => {
    const {
      dispatch,
      biology: { biology },
    } = this.props;
    const { tagsMap } = this.state;

    if (key === 'labels') {
      labelsCache.set(rest, value.map(v => Number(v)));
      value = Array.from(labelsCache.values())
        .flat()
        .map(id => tagsMap.get(id))
        .filter(f => f);
    }

    dispatch({
      type: 'biology/setBiology',
      payload: {
        ...biology,
        [key]: value,
      },
    });
  };

  render() {
    const {
      biology: { biology },
      history,
      form,
      match: {
        params: { id },
      },
    } = this.props;
    const { mainImgList, miniImgList, tagsList, loading } = this.state;
    const imgLim = {
      mini: 20,
      main: 20,
    };
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 5 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 15 },
        md: { span: 15 },
      },
    };
    const labelTip = (lim, tip) => (
      <span>
        {tip}&nbsp;
        <Tooltip title={`最多可上传 ${lim} 张图片`}>
          <Icon type="question-circle-o" />
        </Tooltip>
      </span>
    );

    return (
      <React.Fragment>
        <Card bordered={false} style={{ marginTop: '1em' }} className={styles.Biology}>
          <Form onSubmit={this.handleSubmit} style={{ marginTop: 8 }}>
            <FormItem {...formItemLayout} label={<FormattedMessage id="form.title.label" />}>
              {form.getFieldDecorator('name', {
                rules: [
                  {
                    required: true,
                    message: '物种名称不能为空！',
                  },
                ],
              })(
                <Input
                  placeholder="请输入物种名称"
                  onChange={e => this.handleChange(e.target.value, 'name')}
                  allowClear
                />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={<FormattedMessage id="form.goal.label" />}>
              {form.getFieldDecorator('brief', {
                rules: [
                  {
                    required: true,
                    message: '物种简介不能为空！',
                  },
                ],
              })(
                <TextArea
                  style={{ minHeight: 32 }}
                  rows={4}
                  placeholder="请输入物种简介"
                  onChange={e => this.handleChange(e.target.value, 'brief')}
                />
              )}
            </FormItem>
            {Object.entries(tagsList).map(([label, tag = []]) => (
              <FormItem {...formItemLayout} key={label} label={label}>
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="Please select"
                  defaultValue={labelsCache.get(label)}
                  onChange={value => this.handleChange(value, 'labels', label)}
                >
                  {tag.map(({ name, id }) => (
                    <Option key={id.toString()}>{name}</Option>
                  ))}
                </Select>
              </FormItem>
            ))}
            <FormItem {...formItemLayout} label={labelTip(imgLim.mini, '缩略图')}>
              {(+id === 0 || loading) && (
                <ImgUPload
                  fileList={miniImgList}
                  limit={imgLim.mini}
                  type={TypeMap.MINI}
                  onChange={imgs => this.handleUploadChange(imgs, TypeMap.MINI)}
                />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={labelTip(imgLim.main, '图片')}>
              {(+id === 0 || loading) && (
                <ImgUPload
                  fileList={mainImgList}
                  limit={imgLim.main}
                  type={TypeMap.MAIN}
                  onChange={imgs => this.handleUploadChange(imgs, TypeMap.MAIN)}
                />
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label={
                <span>
                  物种详情&nbsp;
                  <Tooltip title="Ctrl + S 保存当前编辑进度">
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </span>
              }
            >
              <RichTextEditor
                value={biology.content || ''}
                onChange={e => this.handleChange(e, 'content')}
              />
            </FormItem>
            <FormItem {...formItemLayout} colon={false} label={<></>}>
              <Button
                type="default"
                htmlType="button"
                onClick={() => history.push('/biodiversity')}
                style={{ marginRight: '1em' }}
              >
                返 回
              </Button>
              <Button type="primary" htmlType="button" onClick={this.handleSubmit}>
                保 存
              </Button>
            </FormItem>
          </Form>
        </Card>
      </React.Fragment>
    );
  }
}

export default Biology;
