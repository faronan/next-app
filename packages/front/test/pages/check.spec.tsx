import { screen } from '@testing-library/react';
import { auth, renderWithRouter } from '@test/__helpers';
import Check from '@/pages/check';
import { LINT_RULES } from '@/lib/RuleNameData';
import { FindUserDocument } from '@graphql/graphql-operations';

describe(`Check`, () => {
  const testTemplateWord = 'testTemplateWord';
  const testNgWord = 'testNgWord';
  const testEmail = 'test@test.com';
  const mocks = [
    {
      request: {
        query: FindUserDocument,
        variables: { userArgs: { userEmail: testEmail } },
      },
      result: {
        data: {
          findUser: {
            ngWords: [{ wordText: testNgWord }],
            templateWords: [{ wordText: testTemplateWord }],
          },
        },
      },
    },
  ];

  beforeAll(async () => {
    auth();
  });

  beforeEach(async () => {
    renderWithRouter(<Check />, mocks);
  });

  it('should render word feature view', async () => {
    expect(screen.getByText(/スニペット機能/i)).toBeInTheDocument();
    expect(screen.getByText(/ngワード機能/i)).toBeInTheDocument();
    expect(
      await screen.findByText(new RegExp(testTemplateWord)),
    ).toBeInTheDocument();
    expect(await screen.findByText(new RegExp(testNgWord))).toBeInTheDocument();
  });

  it('should render input form view', () => {
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    Object.values(LINT_RULES).forEach((name) => {
      expect(screen.getByText(new RegExp(name))).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /送信/i })).toBeInTheDocument();
  });
});
