import Visualization from 'zeppelin-vis'
import AdvancedTransformation from 'zeppelin-tabledata/advanced-transformation'

import Highcharts from 'highcharts/highcharts'
require('highcharts/modules/data')(Highcharts);
require('highcharts/modules/exporting')(Highcharts);

// http://stackoverflow.com/questions/42076332/uncaught-typeerror-e-dodrilldown-is-not-a-function-highcharts
import Drilldown from 'highcharts/modules/drilldown'
if (!Highcharts.Chart.prototype.addSeriesAsDrilldown) { Drilldown(Highcharts) }

import {
  CommonParameter, createDrilldownDataStructure, createPieChartOption,
} from './chart/pie'

import { HalfDonutParameter, createHalfDonutChartOption } from './chart/harf-donut'

export default class Chart extends Visualization {
  constructor(targetEl, config) {
    super(targetEl, config)

    const spec = {
      charts: {
        'pie': {
          transform: { method: 'drill-down', },
          sharedAxis: true,
          axis: {
            'category': { dimension: 'multiple', axisType: 'key', },
            'value': { dimension: 'multiple', axisType: 'aggregator'},
            'drill-down': { dimension: 'multiple', axisType: 'group', },
          },
          parameter: CommonParameter,
        },

        'half-donut': {
          transform: { method: 'drill-down', },
          sharedAxis: true,
          axis: {
            'category': { dimension: 'multiple', axisType: 'key', },
            'value': { dimension: 'multiple', axisType: 'aggregator'},
            'drill-down': { dimension: 'multiple', axisType: 'group', },
          },
          parameter: HalfDonutParameter,
        },
      },
    }

    this.transformation = new AdvancedTransformation(config, spec)
  }

  getChartElementId() {
    return this.targetEl[0].id
  }

  getChartElement() {
    return document.getElementById(this.getChartElementId())
  }

  clearChart() {
    if (this.chartInstance) { this.chartInstance.destroy() }
  }

  hideChart() {
    this.clearChart()
    this.getChartElement().innerHTML = `
        <div style="margin-top: 60px; text-align: center; font-weight: 100">
            <span style="font-size:30px;">
                Please set axes in
            </span>
            <span style="font-size: 30px; font-style:italic;">
                Settings
            </span>
        </div>`
  }

  drawPieChart(parameter, column, transformer) {
    if (column.aggregator.length === 0) {
      this.hideChart()
      return /** have nothing to display, if aggregator is not specified at all */
    }

    const { rows, } = transformer()

    const { series, drillDownSeries, } = createDrilldownDataStructure(rows)
    const chartOption = createPieChartOption(series, drillDownSeries, parameter)
    this.chartInstance = Highcharts.chart(this.getChartElementId(), chartOption)
  }

  drawHalfDonutChart(parameter, column, transformer) {
    if (column.aggregator.length === 0) {
      this.hideChart()
      return /** have nothing to display, if aggregator is not specified at all */
    }

    const { rows, } = transformer()

    const { series, drillDownSeries, } = createDrilldownDataStructure(rows)
    const chartOption = createHalfDonutChartOption(series, drillDownSeries, parameter)
    this.chartInstance = Highcharts.chart(this.getChartElementId(), chartOption)
  }

  render(data) {
    const { chart, parameter, column, transformer, } = data

    if (chart === 'pie') {
      this.drawPieChart(parameter, column, transformer)
    } else if (chart === 'half-donut') {
      this.drawHalfDonutChart(parameter, column, transformer)
    }
  }

  getTransformation() {
    return this.transformation
  }
}

export function getSeriesName(column) {
  let seriesName = ''

  if (column.key.length > 0) { seriesName = column.key.map(c => c.name).join('.') }
  if (column.aggregator.length === 1) {
    seriesName = `${seriesName} / ${column.aggregator[0].name}`
  } else if (column.aggregator.length > 1) {
    seriesName = `${seriesName} / [${column.aggregator.map(c => c.name).join('|')}]`
  }

  return seriesName
}

