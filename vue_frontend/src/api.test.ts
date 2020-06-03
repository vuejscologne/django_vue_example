import axios from 'axios';
import { fetchData, API } from './apiFoo';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
 
describe('fetchData', () => {
  it('fetches successfully data from an API', async () => {
    const data = {
        data: {
          hits: [
            {
              objectID: '1',
              title: 'a',
            },
            {
              objectID: '2',
              title: 'b',
            },
          ],
        },
      };
   
      mockedAxios.get.mockImplementationOnce(() => Promise.resolve(data));
      await expect(fetchData('react')).resolves.toEqual(data);

      expect(axios.get).toHaveBeenCalledWith(
        `${API}/search?query=react`,
      );  
  });
 
  it('fetches erroneously data from an API', async () => {
    const errorMessage = 'Network Error';
 
    mockedAxios.get.mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage)),
    );
    await expect(fetchData('react')).rejects.toThrow(errorMessage);
  });
});
