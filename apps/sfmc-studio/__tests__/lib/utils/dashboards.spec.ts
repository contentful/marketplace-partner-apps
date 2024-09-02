import { commonChartConfig, } from '@/lib/utils/dashboards';
import dayjs from 'dayjs';


describe('commonChartConfig', () => {
  describe('dateFormatForGraph', () => {
    it('should format date correctly using default formats', () => {
      const date = '2024-08-03';
      const formattedDate = commonChartConfig.dateFormatForGraph(date);
      expect(formattedDate).toBe(dayjs(date).format('DD MMM YYYY'));
    });

    it('should format date correctly using custom formats', () => {
      const date = '2024-08-03';
      const formattedDate = commonChartConfig.dateFormatForGraph(date, 'YYYY-MM-DD', 'MMM D, YYYY');
      expect(formattedDate).toBe(dayjs(date).format('MMM D, YYYY'));
    });
  });

  describe('capitalizeLabel', () => {
    it('should capitalize the first letter of a label', () => {
      const obj = { name: 'example' };
      const capitalized = commonChartConfig.capitalizeLabel(obj, 'name');
      expect(capitalized).toBe('Example');
    });
  });

   describe('handleMouseEnter', () => {
    it('should return id if labelText length is greater than sliceLength', () => {
      const event = { attributes: { labelText: 'VeryLongLabelText' }, __data__: { id: '123' } };
      const id = commonChartConfig.handleMouseEnter(event, 10);
      expect(id).toBe('123');
    });

    it('should return empty string if labelText length is less than or equal to sliceLength', () => {
      const event = { attributes: { labelText: 'Short' }, __data__: { id: '123' } };
      const id = commonChartConfig.handleMouseEnter(event, 10);
      expect(id).toBe('');
    });
  });

  describe('transformLegendText', () => {
    it('should truncate legend text if longer than sliceLength', () => {
    const longLabel = 'ThisIsAVeryLongLabel';
    const shortLabel = commonChartConfig.transformLegendText(longLabel, 4);
    expect(shortLabel).toBe('This...');
  });

    it('should return the label as is if it is shorter than sliceLength', () => {
      const shortLabel = 'Short';
      const transformedLabel = commonChartConfig.transformLegendText(shortLabel, 10);
      expect(transformedLabel).toBe('Short');
    });
  });
 

  describe('axisYLableFormatingBarChart', () => {
    it('should format large values with M suffix', () => {
      expect(commonChartConfig.axisYLableFormatingBarChart(1500000)).toBe('2M');
    });

    it('should format thousands with K suffix', () => {
      expect(commonChartConfig.axisYLableFormatingBarChart(1500)).toBe('2K');
    });

    it('should return the value as a string if less than 1000', () => {
      expect(commonChartConfig.axisYLableFormatingBarChart(500)).toBe('500');
    });
  });
});


