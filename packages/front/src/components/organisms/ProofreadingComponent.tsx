import { MouseEvent, useEffect } from 'react';
import { FetchResult, useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import { useSession } from 'next-auth/client';
import {
  AddProofreadingDataInput,
  CreateProofreadingDocument,
  CreateProofreadingMutation,
  FindUserDocument,
  CreateUserDocument,
  CreateNgWordDocument,
  CreateTemplateWordDocument,
  DeleteNgWordDocument,
  DeleteTemplateWordDocument,
  Word,
} from '@graphql/graphql-operations';
import { HalfGrid } from '@/components/atoms/HalfGrid';
import { ShortIntervalStack } from '@/components/atoms/ShortIntervalStack';
import { SuccessAlert } from '@/components/atoms/SuccessAlert';
import { WarningAlert } from '@/components/atoms/WarningAlert';
import { ProofreadingInputForm } from '@/components/molecules/ProofreadingInputForm';
import { ProofreadingResultText } from '@/components/molecules/ProofreadingResultText';
import { ProofreadingResultTable } from '@/components/molecules/ProofreadingResultTable';
import { CollapseText } from '@/components/molecules/CollapseText';
import { UserWords } from '@/components/molecules/UserWords';

import {
  LINT_RULES,
  BASE_RULES,
  CHECK_RULES,
  QUALITY_RULES,
} from '@/lib/RuleNameData';
import { SAMPLE_TEXT } from '@/lib/SampleTextData';

export const ProofreadingComponent = () => {
  const [text, setText] = useState('');
  const [session] = useSession();
  const [createProofreading] = useMutation(CreateProofreadingDocument);
  const { loading: userFindQueryLoading, data: userFindQueryData } = useQuery(
    FindUserDocument,
    {
      variables: { userArgs: { userEmail: session.user.email } },
    },
  );
  const [createUser] = useMutation(CreateUserDocument);
  const [createNgWord] = useMutation(CreateNgWordDocument);
  const [createTemplateWord] = useMutation(CreateTemplateWordDocument);

  const [deleteNgWord] = useMutation(DeleteNgWordDocument);
  const [deleteTemplateWord] = useMutation(DeleteTemplateWordDocument);

  useEffect(() => {
    if (userFindQueryLoading) {
      return;
    }
    if (userFindQueryData) {
      setTemplateWords(userFindQueryData.findUser.templateWords);
      setNgWords(userFindQueryData.findUser.ngWords);
      return;
    }
    createUser({
      variables: {
        userInput: {
          userEmail: session.user.email,
          userName: session.user.name,
        },
      },
    });
  }, [userFindQueryLoading]);

  const [checkedItems, setCheckedItems] = useState(
    new Array<boolean>(Object.keys(LINT_RULES).length).fill(false),
  );

  type userWords = {
    __typename?: 'Word';
  } & Pick<Word, 'wordText'>[];
  const [templateWords, setTemplateWords] = useState<userWords>([]);
  const [ngWords, setNgWords] = useState<userWords>([]);
  const [isNgAlertShow, setIsNgAlertShow] = useState(false);

  type createProofreadingResult = FetchResult<
    CreateProofreadingMutation,
    Record<string, any>,
    Record<string, any>
  >;

  const [response, setResponse] = useState<createProofreadingResult>({
    data: null,
  });

  const proofreadingButtonOnClick = async (
    e: MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    const selectRuleNames = checkedItems.reduce(
      (arr: string[], val, i) => (
        val && arr.push(Object.keys(LINT_RULES)[i]), arr
      ),
      [],
    );
    const proofreading: AddProofreadingDataInput = {
      text: text,
      ruleNames: selectRuleNames,
      userEmail: session.user.email,
    };
    const response = await createProofreading({
      variables: { proofreading: proofreading },
    });
    setResponse(response);
  };

  const splitResponseText = response.data
    ? response.data.createProofreading.text.split(/\r\n|\n|↵/)
    : [];

  const proofreadResults = response.data
    ? response.data.createProofreading.result
    : [];

  return (
    <HalfGrid>
      <ProofreadingInputForm
        inputText={text}
        textAreaOnChange={(e) => {
          const text = e.target.value;
          setText(text);
          const isIncludeNgWord = ngWords
            .map((word) => text.includes(word.wordText))
            .some((bool) => bool);
          setIsNgAlertShow(isIncludeNgWord);
        }}
        inputSampleText={() => {
          setText(SAMPLE_TEXT);
        }}
        submitButtonOnClick={proofreadingButtonOnClick}
        checkBoxItems={checkedItems}
        setCheckBoxItems={setCheckedItems}
        ruleNames={[
          Object.values(BASE_RULES),
          Object.values(CHECK_RULES),
          Object.values(QUALITY_RULES),
        ]}
        isNgAlertShow={isNgAlertShow}
      ></ProofreadingInputForm>
      <ShortIntervalStack>
        {response.data &&
          (proofreadResults.length > 0 ? (
            <>
              <WarningAlert
                text={`${proofreadResults.length}箇所の文法ミスが見つかりました`}
              ></WarningAlert>
              <ProofreadingResultText
                splitResponseTexts={splitResponseText}
                proofreadResults={proofreadResults}
              ></ProofreadingResultText>
              <ProofreadingResultTable
                splitResponseTexts={splitResponseText}
                proofreadResults={proofreadResults}
              ></ProofreadingResultTable>
            </>
          ) : (
            <SuccessAlert text={'問題ありません🎉'}></SuccessAlert>
          ))}
        <CollapseText text={'スニペット機能'}>
          <UserWords
            words={templateWords}
            createWord={(word) => {
              createTemplateWord({
                variables: {
                  wordInput: {
                    wordText: word,
                    userEmail: session.user.email,
                  },
                },
              });
              setTemplateWords(templateWords.concat([{ wordText: word }]));
            }}
            deleteWord={(word) => {
              deleteTemplateWord({
                variables: {
                  wordInput: {
                    wordText: word,
                    userEmail: session.user.email,
                  },
                },
              });
              setTemplateWords(
                templateWords.filter(
                  (templateWord) => templateWord.wordText !== word,
                ),
              );
            }}
            wordType={'template'}
            description={'使用頻度の高いワードを登録してください'}
          ></UserWords>
        </CollapseText>
        <CollapseText text={'NGワード機能'}>
          <UserWords
            words={ngWords}
            createWord={(word) => {
              createNgWord({
                variables: {
                  wordInput: {
                    wordText: word,
                    userEmail: session.user.email,
                  },
                },
              });
              setNgWords(ngWords.concat([{ wordText: word }]));
            }}
            deleteWord={(word) => {
              deleteNgWord({
                variables: {
                  wordInput: {
                    wordText: word,
                    userEmail: session.user.email,
                  },
                },
              });
              setNgWords(ngWords.filter((ngWord) => ngWord.wordText !== word));
            }}
            wordType={'ng'}
            description={'文章に含めたくないワードを登録してください'}
          ></UserWords>
        </CollapseText>
      </ShortIntervalStack>
    </HalfGrid>
  );
};
